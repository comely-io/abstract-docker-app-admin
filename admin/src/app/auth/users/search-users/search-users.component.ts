import {Component, OnInit} from '@angular/core';
import {ApiErrorHandleOpts, AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {FormControl, FormGroup} from "@angular/forms";
import {paginationFilters} from "../../../shared/pagination/pagination.component";
import {userAccount} from "../manage-user/manage-user.component";
import {userGroup} from "../user-groups/user-groups.component";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {ValidatorService} from "../../../../services/validatorService";
import {ActivatedRoute, Params} from "@angular/router";

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
  public validator: ValidatorService;

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
    perPage: 50,
  };

  public searchUsersForm: FormGroup = new FormGroup({
    search: new FormControl(""),
    referrer: new FormControl(""),
    groupId: new FormControl("0"),
    archived: new FormControl("exclude"),
    status: new FormControl("any"),
    sort: new FormControl("desc")
  });

  constructor(private app: AppService, private aP: AdminPanelService, private route: ActivatedRoute) {
    this.validator = app.validator;
  }

  public async submitSearchForm() {
    let inputErrors: number = 0;
    let searchFor: string = "",
      referrer: string = "",
      groupId: number = 0,
      archived: string = "",
      status: string = "",
      sort: string = "desc";

    // Search for
    try {
      searchFor = this.validator.validateInput(this.searchUsersForm.get("search")?.value, false);
    } catch (e) {
      this.searchUsersForm.get("search")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Referrer
    try {
      referrer = this.validator.validateInput(this.searchUsersForm.get("referrer")?.value, false);
      if (referrer.length > 0) {
        if (!this.validator.validateUsername(referrer)) {
          throw new Error('Invalid referrer username');
        }
      }
    } catch (e) {
      this.searchUsersForm.get("referrer")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Group ID
    try {
      groupId = parseInt(this.searchUsersForm.get("groupId")?.value);
      if (groupId < 0) {
        throw new Error('Invalid group ID selection');
      }
    } catch (e) {
      this.searchUsersForm.get("groupId")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Archived
    try {
      archived = this.validator.validateInput(this.searchUsersForm.get("archived")?.value).toLowerCase();
      if (["exclude", "include", "just"].indexOf(archived) < 0) {
        throw new Error('Invalid archived users filter');
      }
    } catch (e) {
      this.searchUsersForm.get("archived")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Status
    try {
      status = this.validator.validateInput(this.searchUsersForm.get("status")?.value).toLowerCase();
      if (["active", "disabled", "any"].indexOf(status) < 0) {
        throw new Error('Invalid users status filter');
      }
    } catch (e) {
      this.searchUsersForm.get("status")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Sort
    try {
      sort = this.validator.validateInput(this.searchUsersForm.get("sort")?.value).toLowerCase();
      if (["desc", "asc"].indexOf(sort) < 0) {
        throw new Error('Invalid users sort filter');
      }
    } catch (e) {
      this.searchUsersForm.get("sort")?.setErrors({message: e.message});
      inputErrors++;
    }

    if (inputErrors !== 0) {
      return;
    }

    this.searchQuery.search = searchFor;
    this.searchQuery.referrer = referrer;
    this.searchQuery.groupId = groupId;
    this.searchQuery.archived = <searchArchived>archived;
    this.searchQuery.status = <searchStatus>status;
    this.searchQuery.sort = <sortResults>sort;
    this.searchQuery.page = 1;
    this.queryUsers().then();
  }

  public changedLookForValue() {
    let lookFor = this.searchUsersForm.controls.search.value;
    if (lookFor.length > 1) {
      this.searchUsersForm.controls.archived.setValue("include");
    }
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

  public async initPage() {
    await this.fetchGroups().then();
    this.searchIsDisabled = false;
    await this.queryUsers().then();
  }

  ngOnInit(): void {
    this.flashError = this.app.flash.userRetrieveFail;
    this.app.flash.userRetrieveFail = undefined;

    this.route.queryParams.subscribe((params: Params) => {
      if (params.hasOwnProperty("referrer")) {
        this.searchUsersForm.controls.referrer.setValue(params.referrer);
        this.searchAdvCollapse = true;
      }

      if (params.hasOwnProperty("groupId")) {
        let qgId = parseInt(params.groupId);
        if (qgId > 0) {
          this.searchUsersForm.controls.groupId.setValue(qgId);
          this.searchAdvCollapse = true;
        }
      }
    });

    this.initPage().then();

    this.aP.breadcrumbs.next([
      {page: 'Users Control', icon: 'fal fa-users', active: true},
      {page: 'Search', active: true}
    ]);
    this.aP.titleChange.next(["Search Users", "Users"]);
  }
}
