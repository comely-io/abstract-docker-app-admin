import {Component, OnInit} from '@angular/core';
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";

export interface staffMember {
  id: number,
  status: boolean,
  email: string,
  phone?: string,
  checksum: boolean,
  isRoot: boolean
}

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {
  public staffList: Array<staffMember> = [];
  public staffListLoading: boolean = false;
  public isRootAdmin: boolean = false;

  constructor(private app: AppService, private adminPanel: AdminPanelService) {
  }

  public async refreshStaffList() {
    this.staffListLoading = true;
    await this.app.api.callServer("get", "/auth/staff", {}).then((success: ApiSuccess) => {
      this.staffList = success.result.staff;
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });

    this.staffListLoading = false;
  }

  ngOnInit(): void {
    this.isRootAdmin = this.app.auth.session().admin.isRoot;
    this.refreshStaffList().then();
    this.adminPanel.breadcrumbs.next([
      {page: 'Staff Control', active: true},
      {page: 'List', active: true, icon: 'fal fa-users-crown'}
    ]);
    this.adminPanel.titleChange.next(["List Administrators", "Staff"]);
  }
}
