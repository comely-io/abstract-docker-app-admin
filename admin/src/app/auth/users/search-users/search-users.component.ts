import {Component, OnInit} from '@angular/core';
import {ApiErrorHandleOpts, AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {FormControl, FormGroup} from "@angular/forms";
import {paginationFilters} from "../../../shared/pagination/pagination.component";
import {userAccount} from "../manage-user/manage-user.component";
import {userGroup} from "../user-groups/user-groups.component";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";

type sortResults = "desc" | "asc";
type searchArchived = "exclude" | "just" | "include";
type searchStatus = "active" | "disabled" | "any";

interface searchResult {
  totalRows: number,
  page: number,
  perPage: number,
  rows: Array<userAccount>
}

interface searchQuery {
  search?: string,
  referrer?: string,
  groupId?: number,
  archived: searchArchived,
  status: searchStatus
  sort: sortResults,
  page: number,
  perPage: number
}

@Component({
  selector: 'app-search-users',
  templateUrl: './search-users.component.html',
  styleUrls: ['./search-users.component.scss']
})
export class SearchUsersComponent implements OnInit {
  public flashError?: string;

  public searchAdvCollapse: boolean = false;
  public searchIsDisabled: boolean = true;
  public searchIsLoading: boolean = false;

  public usersGroups?: Array<userGroup>;
  public fetchedUsers: Array<userAccount> = [];
  public paginationFilters: paginationFilters = {
    currentPage: 1,
    perPage: 50,
    totalRows: 0
  }

  public searchQuery: searchQuery = {
    search: "",
    referrer: "",
    groupId: 0,
    archived: "exclude",
    status: "any",
    sort: "desc",
    page: 1,
    perPage: 25,
  };

  public searchUsersForm: FormGroup = new FormGroup({
    search: new FormControl(""),
    referrer: new FormControl(""),
    groupId: new FormControl("0"),
    archived: new FormControl("exclude"),
    status: new FormControl("any"),
    sort: new FormControl("desc")
  });

  constructor(private app: AppService, private aP: AdminPanelService) {

  }

  public async submitSearchForm() {

  }

  public changePerPage(e: any) {
    this.searchQuery.perPage = e;
    this.queryUsers().then();
  }

  public changePage(e: any) {
    this.searchQuery.page = e;
    this.queryUsers().then();
  }

  public async queryUsers() {
    if (this.searchIsDisabled || this.searchIsLoading) {
      return;
    }

    this.searchIsDisabled = true;
    this.searchIsLoading = true;
    await this.app.api.callServer("get", "/auth/users", this.searchQuery).then((success: ApiSuccess) => {
      let searchResult: searchResult = <searchResult>success.result.users;
      this.paginationFilters.totalRows = searchResult.totalRows;
      this.paginationFilters.perPage = searchResult.perPage;
      this.paginationFilters.currentPage = searchResult.page;

      this.fetchedUsers = searchResult.rows;
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.searchUsersForm});
    });

    this.searchIsDisabled = false;
    this.searchIsLoading = false;
  }

  public async fetchGroups() {
    this.usersGroups = [];
    await this.app.api.callServer("get", "/auth/users/groups", {}).then((success: ApiSuccess) => {
      this.usersGroups = success.result.groups;
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });
  }

  ngOnInit(): void {
    this.flashError = this.app.flash.userRetrieveFail;

    this.fetchGroups().then();

    this.aP.breadcrumbs.next([
      {page: 'Users Control', icon: 'fal fa-users', active: true},
      {page: 'Search', active: true}
    ]);
    this.aP.titleChange.next(["Search Users", "Users"]);
  }
}
