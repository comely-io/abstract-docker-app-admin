import {Component, OnDestroy, OnInit} from '@angular/core';
import {ValidatorService} from "../../../../services/validatorService";
import {ApiErrorHandleOpts, AppService} from "../../../../services/appService";
import {FormControl, FormGroup} from "@angular/forms";
import {paginationFilters} from "../../../shared/pagination/pagination.component";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {Subscription} from "rxjs";
import {ActivatedRoute, Params} from "@angular/router";

type sortResults = "desc" | "asc";

interface usernamesIndex {
  [key: number]: string
}

export interface publicQuery {
  id: number,
  ipAddress: string,
  method: string,
  endpoint: string,
  startOn: number,
  endOn: number,
  resCode?: number,
  resLen?: number,
  flagApiSess?: number,
  flagUserId?: number
  flagUsername?: string,
  checksumVerified?: boolean,
}

interface searchResult {
  totalRows: number,
  page: number,
  perPage: number,
  rows: Array<publicQuery>
}

interface searchQuery {
  action: "search",
  endpoint?: string,
  method?: string,
  ipAddress?: string,
  sessUserFlag?: string,
  sort: sortResults,
  page: number,
  perPage: number
}

@Component({
  selector: 'app-public-queries',
  templateUrl: './public-queries.component.html',
  styleUrls: ['./public-queries.component.scss']
})
export class PublicQueriesComponent implements OnInit, OnDestroy {
  private urlQueryWatch?: Subscription;
  public validator: ValidatorService;
  public usernamesLoading: boolean = false;
  public usernames: usernamesIndex = {};

  public searchAdvCollapse: boolean = false;
  public searchIsDisabled: boolean = true;
  public searchIsLoading: boolean = false;
  public showResetButton: boolean = false;

  public fetchedQueries: Array<publicQuery> = [];
  public paginationFilters: paginationFilters = {
    currentPage: 1,
    perPage: 50,
    totalRows: 0
  }

  public searchQuery: searchQuery = {
    action: "search",
    endpoint: "",
    method: "",
    ipAddress: "",
    sessUserFlag: "",
    sort: "desc",
    page: 1,
    perPage: 50,
  };

  public searchQueriesForm: FormGroup = new FormGroup({
    endpoint: new FormControl(""),
    method: new FormControl(""),
    ipAddress: new FormControl(""),
    sessUserFlag: new FormControl(""),
    sort: new FormControl("desc")
  });

  constructor(private app: AppService, private aP: AdminPanelService, private route: ActivatedRoute) {
    this.validator = app.validator;
  }

  public async submitSearchForm() {
    this.showResetButton = true;
    let inputErrors: number = 0;
    let searchEndpoint: string = "",
      searchMethod: string = "",
      searchIP: string = "",
      searchSessUserFlag: string = "",
      searchSort: string = "desc";

    // Endpoint
    try {
      searchEndpoint = this.validator.validateInput(this.searchQueriesForm.controls.endpoint.value, false);
      if (searchEndpoint) {
        if (!/^(\/[\w-.]+)+$/.test(searchEndpoint)) {
          throw new Error('Invalid endpoint or path');
        }
      }
    } catch (e) {
      this.searchQueriesForm.controls.endpoint.setErrors({message: e.message});
      inputErrors++;
    }

    // HTTP method
    try {
      searchMethod = this.validator.validateInput(this.searchQueriesForm.controls.method.value, false);
      if (searchMethod) {
        searchMethod = searchMethod.toLowerCase();
        if (["get", "post", "put", "delete"].indexOf(searchMethod) < 0) {
          throw new Error('Invalid HTTP method');
        }
      }
    } catch (e) {
      this.searchQueriesForm.controls.method.setErrors({message: e.message});
      inputErrors++;
    }

    // IP Address
    try {
      searchIP = this.validator.validateInput(this.searchQueriesForm.controls.ipAddress.value, false);
      if (searchIP) {
        if (!/^[a-f0-9.:]{2,45}$/i.test(searchIP)) {
          throw new Error('IP address contains invalid character');
        }
      }
    } catch (e) {
      this.searchQueriesForm.controls.ipAddress.setErrors({message: e.message});
      inputErrors++;
    }

    // Session ID or User's Flag
    try {
      searchSessUserFlag = this.validator.validateInput(this.searchQueriesForm.controls.sessUserFlag.value, false);
      if (searchSessUserFlag) {
        if (!/^[1-9][0-9]+$/.test(searchSessUserFlag)) {
          if (!this.validator.isValidUsername(searchSessUserFlag)) {
            throw new Error('Flag must be either session ID or a username');
          }
        }
      }
    } catch (e) {
      this.searchQueriesForm.controls.sessUserFlag.setErrors({message: e.message});
      inputErrors++;
    }

    // Sort
    try {
      searchSort = this.validator.validateInput(this.searchQueriesForm.controls.sort.value).toLowerCase();
      if (["desc", "asc"].indexOf(searchSort) < 0) {
        throw new Error('Invalid sort filter');
      }
    } catch (e) {
      this.searchQueriesForm.controls.sort.setErrors({message: e.message});
      inputErrors++;
    }

    if (inputErrors !== 0) {
      return;
    }

    this.searchQuery.endpoint = searchEndpoint;
    this.searchQuery.method = searchMethod;
    this.searchQuery.ipAddress = searchIP;
    this.searchQuery.sessUserFlag = searchSessUserFlag;
    this.searchQuery.sort = <sortResults>searchSort;
    this.searchQuery.page = 1;
    this.fetchQueries().then();
  }

  public changePerPage(e: any) {
    this.searchQuery.perPage = e;
    this.fetchQueries().then();
  }

  public changePage(e: any) {
    this.searchQuery.page = e;
    this.fetchQueries().then();
  }

  public async fetchQueries() {
    if (this.searchIsDisabled || this.searchIsLoading) {
      return;
    }

    this.searchIsDisabled = true;
    this.searchIsLoading = true;
    await this.app.api.callServer("get", "/auth/public_api/queries", this.searchQuery).then((success: ApiSuccess) => {
      let searchResult: searchResult = <searchResult>success.result.queries;
      this.paginationFilters.totalRows = searchResult.totalRows;
      this.paginationFilters.perPage = searchResult.perPage;
      this.paginationFilters.currentPage = searchResult.page;

      this.fetchedQueries = searchResult.rows;
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.searchQueriesForm});
    });

    this.searchIsDisabled = false;
    this.searchIsLoading = false;
    this.fetchUsernames().then();
  }

  public async initPage() {
    await this.submitSearchForm().then();
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
    this.fetchedQueries.forEach((query: publicQuery, i: number) => {
      if (!query.flagUserId || query.flagUserId <= 0) {
        return;
      }

      if (query.flagUsername) {
        return;
      }

      if (this.usernames.hasOwnProperty(query.flagUserId)) {
        this.fetchedQueries[i].flagUsername = this.usernames[query.flagUserId];
        return;
      }

      waitList.push(query.flagUserId);
    });

    return waitList;
  }

  public resetSearchForm() {
    this.searchQueriesForm.reset();
    this.searchQueriesForm.controls.method.setValue("");
    this.searchQueriesForm.controls.sort.setValue("desc");
    this.searchAdvCollapse = false;
  }

  ngOnInit(): void {
    this.searchIsDisabled = false;
    this.urlQueryWatch = this.route.queryParams.subscribe((params: Params) => {
      if (params.hasOwnProperty("sessionId")) {
        this.searchQueriesForm.controls.sessUserFlag.setValue(params.sessionId);
        this.searchAdvCollapse = true;
      }

      if (params.hasOwnProperty("username")) {
        this.searchQueriesForm.controls.sessUserFlag.setValue(params.username);
        this.searchAdvCollapse = true;
      }
    });

    setTimeout(() => {
      this.initPage().then()
    }, 500);

    this.aP.breadcrumbs.next([
      {page: 'Public API', active: true, icon: 'fal fa-globe'},
      {page: 'API Queries', active: true}
    ]);
    this.aP.titleChange.next(["API Queries", "Public API"]);
  }

  ngOnDestroy() {
    this.urlQueryWatch?.unsubscribe();
  }
}
