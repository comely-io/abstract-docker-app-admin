import {Component, OnDestroy, OnInit} from '@angular/core';
import {userAccountIds} from "../../users/manage-user/manage-user.component";
import {paginationFilters} from "../../../shared/pagination/pagination.component";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiErrorHandleOpts, AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {ValidatorService} from "../../../../services/validatorService";

type sessionType = "web" | "app";
type sortResults = "desc" | "asc";
type searchArchived = "exclude" | "just" | "include";

export interface publicSession {
  id: number,
  type: sessionType,
  archived: boolean,
  checksumVerified: boolean,
  token: Array<string>,
  ipAddress: string,
  userAgent: string,
  fingerprint: string,
  authUser?: userAccountIds,
  authUserId: number,
  authSessionOtp: boolean,
  last2faOn: number,
  lastRecaptchaOn: number,
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

@Component({
  selector: 'app-public-sessions',
  templateUrl: './public-sessions.component.html',
  styleUrls: ['./public-sessions.component.scss']
})
export class PublicSessionsComponent implements OnInit, OnDestroy {

  public validator: ValidatorService;
  public searchAdvCollapse: boolean = false;
  public searchIsDisabled: boolean = true;
  public searchIsLoading: boolean = false;

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

  constructor(private app: AppService, private aP: AdminPanelService) {
    this.validator = app.validator;
  }

  public async submitSearchForm() {
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
  }

  public async initPage() {
    this.searchIsDisabled = false;
    await this.querySessions().then();
  }

  ngOnInit(): void {
    this.initPage().then();

    this.aP.breadcrumbs.next([
      {page: 'Public API', active: true, icon: 'fal fa-globe'},
      {page: 'Sessions', active: true}
    ]);
    this.aP.titleChange.next(["Sessions", "Public API"]);
  }

  ngOnDestroy() {
  }
}
