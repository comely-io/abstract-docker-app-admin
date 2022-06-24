import {Component, OnInit} from '@angular/core';
import {staffMember} from "../list/list.component";
import {FormControl, FormGroup} from "@angular/forms";
import {paginationFilters} from "../../../shared/pagination/pagination.component";
import {ApiErrorHandleOpts, AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {ActivatedRoute, Params} from "@angular/router";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";

type sortByCol = "issued_on" | "last_used_on";

interface searchResult {
  totalRows: number,
  page: number,
  perPage: number,
  rows: Array<adminSession>
}

interface adminSession {
  id: number,
  type: string,
  archived: number,
  adminId: number,
  adminEmail?: string,
  ipAddress: string,
  last2faOn: number | undefined | null,
  issuedOn: number,
  lastUsedOn: number,
  checksumHealth: boolean,
  partialToken: string
}

interface searchQuery {
  admin: number,
  archived?: null | number,
  key?: string | null,
  value?: string | null,
  page: number,
  perPage: number,
  sort: sortByCol
}

@Component({
  selector: 'app-admin-sessions',
  templateUrl: './admin-sessions.component.html',
  styleUrls: ['./admin-sessions.component.scss']
})
export class AdminSessionsComponent implements OnInit {
  public staffList?: Array<staffMember> = [];
  public searchAdvCollapse: boolean = false;
  public searchIsDisabled: boolean = true;
  public searchIsLoading: boolean = false;

  public fetchedSessions: Array<adminSession> = [];
  public paginationFilters: paginationFilters = {
    currentPage: 1,
    perPage: 25,
    totalRows: 0
  }

  public searchQuery: searchQuery = {
    admin: 0,
    page: 1,
    perPage: 25,
    sort: "issued_on"
  };

  public searchSessionsForm: FormGroup = new FormGroup({
    adminId: new FormControl(0),
    archived: new FormControl(""),
    key: new FormControl(""),
    value: new FormControl(),
    sort: new FormControl("issued_on")
  });

  constructor(private app: AppService, private adminPanel: AdminPanelService, private route: ActivatedRoute) {
  }

  public getStaffEmail(id: number): string | undefined {
    let foundStaffException = {};
    let staffId: undefined | string;

    if (this.staffList) {
      try {
        this.staffList.forEach((staff: staffMember) => {
          if (staff.id === id) {
            staffId = staff.email;
            throw foundStaffException;
          }
        });
      } catch (e) {
      }
    }

    return staffId;
  }

  public submitSearchForm(): void {
    let errorsCount = 0;
    let adminId: number = 0,
      archived: string,
      searchKey: string = "",
      searchValue: string = "",
      sortBy: string;

    // Administrator ID
    try {
      adminId = this.searchSessionsForm.get("adminId")?.value ?? 0;
      if (adminId < 0) {
        throw new Error('Select an administrator account or any');
      }
    } catch (e) {
      this.searchSessionsForm.get("adminId")?.setErrors({message: e.message});
      errorsCount++;
    }

    // Archived
    archived = this.searchSessionsForm.get("archived")?.value ?? "";

    // Search Key & Value
    try {
      searchKey = this.searchSessionsForm.get("key")?.value;
      searchValue = this.searchSessionsForm.get("value")?.value;
      if (searchKey && !searchValue) {
        throw new Error('Search value is required');
      }
    } catch (e) {
      this.searchSessionsForm.get("value")?.setErrors({message: e.message});
      errorsCount++;
    }

    // Sort By
    sortBy = this.searchSessionsForm.get("sort")?.value;
    if (["issued_on", "last_used_on"].indexOf(sortBy) < 0) {
      this.searchSessionsForm.get("sort")?.setErrors({message: 'Invalid sort by column'});
      errorsCount++;
    }

    if (errorsCount !== 0) {
      return;
    }

    this.searchQuery.admin = adminId;

    delete this.searchQuery.archived;
    if (["true", "false"].indexOf(archived) >= 0) {
      this.searchQuery.archived = archived === "true" ? 1 : 0;
    }

    delete this.searchQuery.key;
    delete this.searchQuery.value;
    if (searchKey && searchValue) {
      this.searchQuery.key = searchKey;
      this.searchQuery.value = searchValue;
    }

    this.searchQuery.sort = <sortByCol>sortBy;
    this.searchQuery.page = 1;
    this.querySessions().then();
  }

  public selectAdminId(id: number): void {
    this.searchSessionsForm.controls.adminId.setValue(id);
    this.submitSearchForm();
  }

  public changePerPage(e: any) {
    this.searchQuery.perPage = e;
    this.querySessions().then();
  }

  public changePage(e: any) {
    this.searchQuery.page = e;
    this.querySessions().then();
  }

  public async getStaffList() {
    await this.app.api.callServer("get", "/auth/staff", {}).then((success: ApiSuccess) => {
      this.staffList = success.result.staff;
      this.searchIsDisabled = false;
      this.querySessions().then();
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });

    // Selected admin?
    this.route.queryParams.subscribe((params: Params) => {
      if (params.hasOwnProperty("admin")) {
        let selectedStaffId: number = parseInt(params["admin"]);
        if (selectedStaffId > 0) {
          this.selectAdminId(selectedStaffId);
        }
      }
    });
  }

  public async querySessions() {
    if (this.searchIsDisabled || this.searchIsLoading) {
      return;
    }

    this.searchIsDisabled = true;
    this.searchIsLoading = true;
    await this.app.api.callServer("get", "/auth/staff/sessions", this.searchQuery).then((success: ApiSuccess) => {
      let searchResult: searchResult = <searchResult>success.result.sessions;
      this.paginationFilters.totalRows = searchResult.totalRows;
      this.paginationFilters.perPage = searchResult.perPage;
      this.paginationFilters.currentPage = searchResult.page;

      searchResult.rows.forEach((sess: adminSession, index: number) => {
        searchResult.rows[index].adminEmail = this.getStaffEmail(sess.adminId);
      });

      this.fetchedSessions = searchResult.rows;
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.searchSessionsForm});
    });

    this.searchIsDisabled = false;
    this.searchIsLoading = false;
  }

  ngOnInit(): void {
    this.getStaffList().then();

    this.adminPanel.breadcrumbs.next([
      {page: 'Staff Control', active: true},
      {page: 'Browse Sessions', active: true, icon: 'fal fa-users-crown'}
    ]);
    this.adminPanel.titleChange.next(["Browse Sessions", "Staff"]);
  }
}
