import {Component, OnDestroy, OnInit} from '@angular/core';
import {paginationFilters} from "../../../shared/pagination/pagination.component";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiErrorHandleOpts, AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {ValidatorService} from "../../../../services/validatorService";
import {BehaviorSubject, Subscription} from "rxjs";
import {TotpModalComponent, totpModalControl} from "../../../shared/totp-modal/totp-modal.component";
import {MdbModalRef, MdbModalService} from "mdb-angular-ui-kit/modal";
import * as moment from "moment/moment";
import {PubSessionInfoComponent} from "./pub-session-info/pub-session-info.component";

type sessionType = "web" | "app";
type sortResults = "desc" | "asc";
type searchArchived = "exclude" | "just" | "include";

interface usernamesIndex {
  [key: number]: string
}

export interface publicSession {
  id: number,
  type: sessionType,
  archived: boolean,
  checksumVerified: boolean,
  token: Array<string>,
  ipAddress: string,
  userAgent: string,
  fingerprint: string,
  authUserUsername?: string,
  authUserId: number,
  authSessionOtp: boolean,
  last2faOn?: number,
  lastRecaptchaOn?: number,
  issuedOn: number,
  lastUsedOn: number,
}

interface searchResult {
  totalRows: number,
  page: number,
  perPage: number,
  rows: Array<publicSession>
}

interface searchQuery {
  token?: string,
  ipAddress?: string,
  fingerprint?: string,
  user?: string,
  archived: searchArchived,
  sort: sortResults,
  page: number,
  perPage: number
}

interface totpQuery {
  command: string,
  sessionId?: number,
}

@Component({
  selector: 'app-public-sessions',
  templateUrl: './public-sessions.component.html',
  styleUrls: ['./public-sessions.component.scss']
})
export class PublicSessionsComponent implements OnInit, OnDestroy {
  public usernames: usernamesIndex = {};
  public validator: ValidatorService;
  public searchAdvCollapse: boolean = false;
  public searchIsDisabled: boolean = true;
  public searchIsLoading: boolean = false;
  public showResetButton: boolean = false;
  public usernamesLoading: boolean = false;

  public fetchedSessions: Array<publicSession> = [];
  public paginationFilters: paginationFilters = {
    currentPage: 1,
    perPage: 50,
    totalRows: 0
  }

  public searchQuery: searchQuery = {
    token: "",
    ipAddress: "",
    fingerprint: "",
    user: "",
    archived: "exclude",
    sort: "desc",
    page: 1,
    perPage: 50,
  };

  public searchSessionsForm: FormGroup = new FormGroup({
    token: new FormControl(""),
    ipAddress: new FormControl(""),
    fingerprint: new FormControl(""),
    user: new FormControl(""),
    archived: new FormControl("exclude"),
    sort: new FormControl("desc")
  });

  private lastArchivedOn?: number;
  private totpQueryCmd?: totpQuery;
  private totpModalControl: BehaviorSubject<totpModalControl> = new BehaviorSubject<totpModalControl>({});
  private totpCodeReceived: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private watchTotp?: Subscription;

  private loadingSession: boolean = false;
  private sessionInfoModal?: MdbModalRef<PubSessionInfoComponent>;
  private sessionInfoModalWatch?: Subscription;

  constructor(private app: AppService, private aP: AdminPanelService, private modals: MdbModalService) {
    this.validator = app.validator;

  }

  public async loadSessionModal(sessionId: number) {
    if (this.loadingSession) {
      return;
    }

    let found: undefined | publicSession = undefined;
    this.loadingSession = true;
    this.fetchedSessions.forEach((session: publicSession) => {
      if (session.id === sessionId) {
        found = session;
        return;
      }
    });

    this.loadingSession = false;
    if (!found) {
      return;
    }

    this.sessionInfoModal = this.modals.open(PubSessionInfoComponent, {
      modalClass: "modal-lg modal-dialog-scrollable",
      data: {
        session: found,
      }
    });

    if (this.sessionInfoModalWatch) {
      this.sessionInfoModalWatch.unsubscribe();
    }

    this.sessionInfoModalWatch = this.sessionInfoModal.onClose.subscribe((msg) => {
      if (typeof msg === "object" && msg.hasOwnProperty("searchFp") && typeof msg.searchFp === "string") {
        this.clickSearchFingerprint(msg.searchFp);
      }
    });
  }

  public archiveSession(sessionId: number) {
    let requireTotp: boolean = !(this.lastArchivedOn && (moment().unix() - this.lastArchivedOn) <= 120);
    if (!requireTotp) {
      this.queryArchiveSession(sessionId).then();
      return;
    }

    this.totpQueryCmd = {command: "delete", sessionId: sessionId};
    this.modals.open(TotpModalComponent, {
      data: {
        body: `<span class="text-primary">TOTP is required to <strong>Archive a Public API Session</strong>.</span>`,
        totpModalControl: this.totpModalControl,
        totpCodeAccept: this.totpCodeReceived
      }
    });
  }

  private async totpArchiveSession(totpCode: string) {
    if (!this.totpQueryCmd || !(this.totpQueryCmd.sessionId && this.totpQueryCmd.sessionId > 0)) {
      return;
    }

    this.totpModalControl.next({loading: true, disabled: true});
    await this.queryArchiveSession(this.totpQueryCmd.sessionId, totpCode, true);
    this.totpModalControl.next({loading: false, disabled: false});
  }

  private async queryArchiveSession(sessionId: any, totpCode?: string, modalCtrl: boolean = false) {
    if (typeof sessionId !== "number") {
      return;
    }

    await this.app.api.callServer("delete", "/auth/public_api/sessions", {
      sessionId: sessionId,
      totp: totpCode ?? ""
    }).then((success: ApiSuccess) => {
      if (success.result.status === true) {
        this.lastArchivedOn = moment().unix();
        if (modalCtrl) {
          this.totpModalControl.next({close: true});
        }

        this.fetchedSessions.forEach((session: publicSession, i: number) => {
          if (session.id === sessionId) {
            this.fetchedSessions[i].archived = true;
          }
        });
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });
  }

  public async submitSearchForm() {
    this.showResetButton = true;
    let inputErrors: number = 0;
    let searchToken: string = "",
      searchIP: string = "",
      searchFingerprint: string = "",
      searchUser: string = "",
      searchArchived: string = "",
      searchSort: string = "desc";

    // Token
    try {
      searchToken = this.validator.validateInput(this.searchSessionsForm.controls.token.value, false);
      if (searchToken) {
        if (!/^[a-f0-9]{2,64}$/i.test(searchToken)) {
          throw new Error('Session token contains invalid character');
        }

        if (!/^[0-9]+$/.test(searchToken)) { // Is hexadecimal
          if (searchToken.length % 2 !== 0) {
            throw new Error('Session token must be of even length');
          }
        }
      }
    } catch (e) {
      this.searchSessionsForm.controls.token.setErrors({message: e.message});
      inputErrors++;
    }

    // IP Address
    try {
      searchIP = this.validator.validateInput(this.searchSessionsForm.controls.ipAddress.value, false);
      if (searchIP) {
        if (!/^[a-f0-9.:]{2,45}$/i.test(searchIP)) {
          throw new Error('IP address contains invalid character');
        }
      }
    } catch (e) {
      this.searchSessionsForm.controls.ipAddress.setErrors({message: e.message});
      inputErrors++;
    }

    // Token
    try {
      searchFingerprint = this.validator.validateInput(this.searchSessionsForm.controls.fingerprint.value, false);
      if (searchFingerprint) {
        if (!/^[a-f0-9]{2,64}$/i.test(searchFingerprint)) {
          throw new Error('Fingerprint contains invalid character');
        }

        if (searchFingerprint.length % 2 !== 0) {
          throw new Error('Fingerprint must be of even length');
        }
      }
    } catch (e) {
      this.searchSessionsForm.controls.fingerprint.setErrors({message: e.message});
      inputErrors++;
    }

    // User
    try {
      searchUser = this.validator.validateInput(this.searchSessionsForm.controls.user.value, false);
      if (searchUser) {
        if (!this.validator.isValidPhNum(searchUser) && !this.validator.isValidEmail(searchUser) && !this.validator.isValidUsername(searchUser)) {
          throw new Error('Invalid username OR e-mail OR phone');
        }
      }
    } catch (e) {
      this.searchSessionsForm.controls.user.setErrors({message: e.message});
      inputErrors++;
    }

    // Archived
    try {
      searchArchived = this.validator.validateInput(this.searchSessionsForm.controls.archived.value).toLowerCase();
      if (["exclude", "include", "just"].indexOf(searchArchived) < 0) {
        throw new Error('Invalid archived sessions filter');
      }
    } catch (e) {
      this.searchSessionsForm.controls.archived.setErrors({message: e.message});
      inputErrors++;
    }

    // Sort
    try {
      searchSort = this.validator.validateInput(this.searchSessionsForm.controls.sort.value).toLowerCase();
      if (["desc", "asc"].indexOf(searchSort) < 0) {
        throw new Error('Invalid sort filter');
      }
    } catch (e) {
      this.searchSessionsForm.controls.sort.setErrors({message: e.message});
      inputErrors++;
    }

    if (inputErrors !== 0) {
      return;
    }

    this.searchQuery.token = searchToken;
    this.searchQuery.ipAddress = searchIP;
    this.searchQuery.fingerprint = searchFingerprint;
    this.searchQuery.user = searchUser;
    this.searchQuery.archived = <searchArchived>searchArchived;
    this.searchQuery.sort = <sortResults>searchSort;
    this.searchQuery.page = 1;
    this.querySessions().then();
  }

  private async fetchUsernames() {
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
    this.fetchedSessions.forEach((session: publicSession, i: number) => {
      if (!session.authUserId || session.authUserId <= 0) {
        return;
      }

      if (session.authUserUsername) {
        return;
      }

      if (this.usernames.hasOwnProperty(session.authUserId)) {
        this.fetchedSessions[i].authUserUsername = this.usernames[session.authUserId];
        return;
      }

      waitList.push(session.authUserId);
    });

    return waitList;
  }

  public changePerPage(e: any) {
    this.searchQuery.perPage = e;
    this.querySessions().then();
  }

  public changePage(e: any) {
    this.searchQuery.page = e;
    this.querySessions().then();
  }

  public async querySessions() {
    if (this.searchIsDisabled || this.searchIsLoading) {
      return;
    }

    this.searchIsDisabled = true;
    this.searchIsLoading = true;
    await this.app.api.callServer("get", "/auth/public_api/sessions", this.searchQuery).then((success: ApiSuccess) => {
      let searchResult: searchResult = <searchResult>success.result.sessions;
      this.paginationFilters.totalRows = searchResult.totalRows;
      this.paginationFilters.perPage = searchResult.perPage;
      this.paginationFilters.currentPage = searchResult.page;

      this.fetchedSessions = searchResult.rows;
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.searchSessionsForm});
    });

    this.searchIsDisabled = false;
    this.searchIsLoading = false;
    this.fetchUsernames().then();
  }

  public clickSearchFingerprint(fp: string): void {
    this.searchAdvCollapse = true;
    this.showResetButton = true;
    this.searchSessionsForm.controls.fingerprint.setValue(fp);
  }

  public resetSearchForm() {
    this.searchSessionsForm.reset();
    this.searchSessionsForm.controls.archived.setValue("exclude");
    this.searchSessionsForm.controls.sort.setValue("desc");
    this.searchAdvCollapse = false;
  }

  public async initPage() {
    this.searchIsDisabled = false;
    await this.querySessions().then();
  }

  ngOnInit(): void {
    this.initPage().then();

    this.watchTotp = this.totpCodeReceived.subscribe((totpCode: string | null) => {
      if (typeof totpCode !== "string" || totpCode.length !== 6) {
        return;
      }

      if (!this.totpQueryCmd) {
        return;
      }

      switch (this.totpQueryCmd.command) {
        case "delete":
          this.totpArchiveSession(totpCode).then();
          return;
      }
    });


    this.aP.breadcrumbs.next([
      {page: 'Public API', active: true, icon: 'fal fa-globe'},
      {page: 'Sessions', active: true}
    ]);
    this.aP.titleChange.next(["Sessions", "Public API"]);
  }

  ngOnDestroy() {
    this.sessionInfoModalWatch?.unsubscribe();
  }
}
