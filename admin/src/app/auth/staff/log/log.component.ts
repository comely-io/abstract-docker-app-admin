import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {ApiErrorHandleOpts, AppService} from "../../../../services/appService";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {staffMember} from "../list/list.component";
import {paginationFilters} from "../../../shared/pagination/pagination.component";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {ActivatedRoute, Params} from "@angular/router";

interface searchResult {
  totalRows: number,
  page: number,
  perPage: number,
  rows: Array<activityLog>
}

interface activityLog {
  id: number,
  admin: number,
  adminEmail?: string,
  flags: Array<string> | undefined | null,
  controller: string | undefined | null,
  log: string,
  ipAddress: string,
  timeStamp: number
}

interface searchLogs {
  admin: number,
  page: number,
  perPage: number,
  flags?: string,
  filter?: string
}

@Component({
  selector: 'app-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss']
})
export class LogComponent implements OnInit {
  public staffList?: Array<staffMember> = [];
  public searchIsDisabled: boolean = true;
  public searchIsLoading: boolean = false;

  public retrievedLogs?: Array<activityLog>;
  public paginationFilters: paginationFilters = {
    currentPage: 1,
    perPage: 25,
    totalRows: 0
  }

  public searchLogs: searchLogs = {
    admin: 0,
    page: 1,
    perPage: 25,
    flags: "",
    filter: "",
  };

  public searchLogsForm: FormGroup = new FormGroup({
    adminId: new FormControl(),
    flags: new FormControl(),
    filter: new FormControl()
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
      flags: string = "",
      filter: string = "";

    // Administrator ID
    try {
      adminId = this.searchLogsForm.get("adminId")?.value ?? 0;
      if (adminId < 0) {
        throw new Error('Select an administrator account or any');
      }
    } catch (e) {
      this.searchLogsForm.get("adminId")?.setErrors({message: e.message});
      errorsCount++;
    }

    // Flags
    try {
      flags = this.searchLogsForm.get("flags")?.value ?? "";
      if (flags.length) {
        if (flags.length > 32) {
          throw new Error('Flags search field cannot exceed 32 bytes');
        }

        let flagsI: Array<string> = flags.split(/[\s,]+/);
        if (flagsI.length) {
          flagsI.forEach((flag: string, index: number) => {
            if (!/^[\w.\-]{1,16}(:[0-9]{1,10})?$/.test(flag)) {
              throw new Error('Invalid flag value at index ' + index);
            }
          })
        }
      }
    } catch (e) {
      this.searchLogsForm.get("flags")?.setErrors({message: e.message});
      errorsCount++;
    }

    // Filter
    try {
      filter = this.searchLogsForm.get("filter")?.value ?? "";
      if (filter.length) {
        if (!/^\w+[\w\s@\-:=.#",()\[\];]+$/.test(filter)) {
          throw new Error('Invalid log message filter');
        }
      }
    } catch (e) {
      this.searchLogsForm.get("filter")?.setErrors({message: e.message});
      errorsCount++;
    }

    if (errorsCount !== 0) {
      return;
    }

    this.searchLogs.admin = adminId;
    this.searchLogs.flags = flags;
    this.searchLogs.filter = filter;
    this.searchLogs.page = 1;
    this.queryActivityLog().then();
  }

  public selectAdminId(id: number): void {
    this.searchLogsForm.controls.adminId.setValue(id);
    this.submitSearchForm();
  }

  public changePerPage(e: any) {
    this.searchLogs.perPage = e;
    this.queryActivityLog().then();
  }

  public changePage(e: any) {
    this.searchLogs.page = e;
    this.queryActivityLog().then();
  }

  public async getStaffList() {
    await this.app.api.callServer("get", "/auth/staff", {}).then((success: ApiSuccess) => {
      this.staffList = success.result.staff;
      this.searchIsDisabled = false;
      this.queryActivityLog().then();
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });
  }

  public async queryActivityLog() {
    if (this.searchIsDisabled || this.searchIsLoading) {
      return;
    }

    this.searchIsDisabled = true;
    this.searchIsLoading = true;
    await this.app.api.callServer("get", "/auth/staff/logs", this.searchLogs).then((success: ApiSuccess) => {
      let searchResult: searchResult = <searchResult>success.result.logs;
      this.paginationFilters.totalRows = searchResult.totalRows;
      this.paginationFilters.perPage = searchResult.perPage;
      this.paginationFilters.currentPage = searchResult.page;

      searchResult.rows.forEach((log: activityLog, index: number) => {
        searchResult.rows[index].adminEmail = this.getStaffEmail(log.admin);
      });

      this.retrievedLogs = searchResult.rows;
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.searchLogsForm});
    });

    this.searchIsDisabled = false;
    this.searchIsLoading = false;
  }

  ngOnInit(): void {
    // Selected admin?
    this.route.queryParams.subscribe((params: Params) => {
      if (params.hasOwnProperty("admin")) {
        let selectedStaffId: number = parseInt(params["admin"]);
        if (selectedStaffId > 0) {
          this.selectAdminId(selectedStaffId);
        }
      }

      if (params.hasOwnProperty("flags")) {
        if (typeof params.flags === "string" && params.flags.length) {
          this.searchLogsForm.controls.flags.setValue(params.flags);
        }
      }
    });

    this.getStaffList().then();

    this.adminPanel.breadcrumbs.next([
      {page: 'Staff Control', active: true},
      {page: 'Activity Log', active: true, icon: 'fal fa-users-crown'}
    ]);
    this.adminPanel.titleChange.next(["Activity Log", "Staff"]);
  }
}
