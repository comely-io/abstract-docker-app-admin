import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from "rxjs";
import {ApiErrorHandleOpts, AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {ActivatedRoute, Params} from "@angular/router";
import {ValidatorService} from "../../../../services/validatorService";
import {FormControl, FormGroup} from "@angular/forms";
import {paginationFilters} from "../../../shared/pagination/pagination.component";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {PubSessionInfoComponent} from "../../public-api/public-sessions/pub-session-info/pub-session-info.component";
import {publicSession} from "../../public-api/public-sessions/public-sessions.component";
import {MdbModalService} from "mdb-angular-ui-kit/modal";

interface usernamesIndex {
  [key: number]: string
}

interface searchResult {
  totalRows: number,
  page: number,
  perPage: number,
  rows: Array<activityLog>
}

interface activityLog {
  id: number,
  user: number,
  username?: string,
  session: number,
  flags: Array<string> | undefined | null,
  controller: string | undefined | null,
  data?: string,
  log: string,
  ipAddress: string,
  timeStamp: number
}

interface searchLogs {
  username: string,
  flags: string,
  filter: string,
  page: number,
  perPage: number,
}

@Component({
  selector: 'app-user-logs',
  templateUrl: './user-logs.component.html',
  styleUrls: ['./user-logs.component.scss']
})
export class UserLogsComponent implements OnInit, OnDestroy {
  private urlQueryWatch?: Subscription;
  public validator: ValidatorService;
  public usernamesLoading: boolean = false;
  public usernames: usernamesIndex = {};

  public searchIsDisabled: boolean = true;
  public searchIsLoading: boolean = false;

  public fetchedLogs: Array<activityLog> = [];
  public paginationFilters: paginationFilters = {
    currentPage: 1,
    perPage: 50,
    totalRows: 0
  }

  public searchLogs: searchLogs = {
    username: "",
    flags: "",
    filter: "",
    page: 1,
    perPage: 50,
  };

  public searchLogsForm: FormGroup = new FormGroup({
    username: new FormControl(),
    flags: new FormControl(),
    filter: new FormControl()
  });

  private loadingSessionModal: boolean = false;

  constructor(private app: AppService, private aP: AdminPanelService, private route: ActivatedRoute, private modals: MdbModalService) {
    this.validator = app.validator;
  }

  public submitSearchForm() {
    let inputErrors: number = 0;
    let searchUsername: string,
      searchFlags: string,
      searchFilter: string;

    // Username
    searchUsername = this.validator.validateInput(this.searchLogsForm.controls.username.value, false);
    if (searchUsername) {
      try {
        if (!this.validator.isValidUsername(searchUsername)) {
          throw new Error('Invalid username');
        }
      } catch (e) {
        this.searchLogsForm.controls.username.setErrors({message: e.message});
        inputErrors++;
      }
    }

    // Flags
    searchFlags = this.validator.validateInput(this.searchLogsForm.controls.flags.value, false);
    if (searchFlags) {
      try {
        if (searchFlags.length > 32) {
          throw new Error('Flags search field cannot exceed 32 bytes');
        }

        let flagsI: Array<string> = searchFlags.split(/[\s,]+/);
        if (flagsI.length) {
          flagsI.forEach((flag: string, index: number) => {
            if (!/^[\w.\-]{1,16}(:\d{1,10})?$/.test(flag)) {
              throw new Error('Invalid flag value at index ' + index);
            }
          })
        }
      } catch (e) {
        this.searchLogsForm.controls.flags.setErrors({message: e.message});
        inputErrors++;
      }
    }

    // Filter
    searchFilter = this.validator.validateInput(this.searchLogsForm.controls.filter.value, false);
    if (searchFilter) {
      try {
        if (!/^\w+[\w\s@\-:=.#",()\[\];]+$/.test(searchFilter)) {
          throw new Error('Invalid log message filter');
        }
      } catch (e) {
        this.searchLogsForm.controls.filter.setErrors({message: e.message});
        inputErrors++;
      }
    }

    if (inputErrors !== 0) {
      return;
    }

    this.searchLogs.username = searchUsername;
    this.searchLogs.flags = searchFlags;
    this.searchLogs.filter = searchFilter;
    this.searchLogs.page = 1;
    this.fetchLogs().then();
  }

  public async loadSessionModal(log: activityLog) {
    if (this.loadingSessionModal) {
      return;
    }

    if (!log.session || !(log.session > 0)) {
      return;
    }

    this.loadingSessionModal = true;
    await this.app.api.callServer("get", "/auth/public_api/sessions", {sessionId: log.session}).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("session") && typeof success.result.session === "object") {
        this.modals.open(PubSessionInfoComponent, {
          modalClass: "modal-lg modal-dialog-scrollable",
          data: {
            session: <publicSession>success.result.session,
            isSessionsPage: false,
            overrideUsername: log?.username,
          }
        });
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });

    this.loadingSessionModal = false;
  }

  private async fetchUsernames() {
    if (this.usernamesLoading) {
      return;
    }

    let waitList = this.updateUsernames();
    if (!waitList.length) {
      return;
    }

    this.usernamesLoading = true;
    await this.app.api.callServer("get", "/auth/users", {
      action: "usernames",
      id: waitList.join(",")
    }).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("usernames") && typeof success.result.usernames === "object") {
        Object.keys(success.result.usernames).forEach((key: any) => {
          let userId: number = parseInt(key);
          let username: string = success.result.usernames[key];
          if (userId > 0 && this.validator.isValidUsername(username)) {
            this.usernames[userId] = username;
          }
        });
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });
    this.usernamesLoading = false;

    this.updateUsernames(); // Set newly fetched usernames
  }

  private updateUsernames(): Array<number> {
    let waitList: Array<number> = [];
    this.fetchedLogs.forEach((log: activityLog, i: number) => {
      if (!log.user || log.user <= 0) {
        return;
      }

      if (log.username) {
        return;
      }

      if (this.usernames.hasOwnProperty(log.user)) {
        this.fetchedLogs[i].username = this.usernames[log.user];
        return;
      }

      waitList.push(log.user);
    });

    return waitList;
  }

  public async fetchLogs() {
    if (this.searchIsDisabled || this.searchIsLoading) {
      return;
    }

    this.searchIsDisabled = true;
    this.searchIsLoading = true;
    await this.app.api.callServer("get", "/auth/users/logs", this.searchLogs).then((success: ApiSuccess) => {
      let searchResult: searchResult = <searchResult>success.result.logs;
      this.paginationFilters.totalRows = searchResult.totalRows;
      this.paginationFilters.perPage = searchResult.perPage;
      this.paginationFilters.currentPage = searchResult.page;
      this.fetchedLogs = searchResult.rows;
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.searchLogsForm});
    });

    this.searchIsDisabled = false;
    this.searchIsLoading = false;
    this.fetchUsernames().then();
  }

  public changePerPage(e: any) {
    this.searchLogs.perPage = e;
    this.fetchLogs().then();
  }

  public changePage(e: any) {
    this.searchLogs.page = e;
    this.fetchLogs().then();
  }

  ngOnInit(): void {
    this.urlQueryWatch = this.route.queryParams.subscribe((params: Params) => {
      if (params.hasOwnProperty("username")) {
        if (this.validator.isValidUsername(params.username)) {
          this.searchLogsForm.controls.username.setValue(params.username);
        }
      }
    });

    this.searchIsDisabled = false;
    setTimeout(() => {
      this.fetchLogs().then();
    }, 300);

    this.aP.breadcrumbs.next([
      {page: 'Users Control', icon: 'fal fa-users', active: true},
      {page: 'Activity Log', active: true}
    ]);
    this.aP.titleChange.next(["Activity Log", "Users"]);
  }

  ngOnDestroy() {
    this.urlQueryWatch?.unsubscribe();
  }
}
