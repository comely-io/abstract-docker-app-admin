import {Component, OnInit} from '@angular/core';
import {AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {ActivatedRoute, Params} from "@angular/router";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {staffMember} from "../list/list.component";

@Component({
  selector: 'app-edit-admin',
  templateUrl: './edit-admin.component.html',
  styleUrls: ['./edit-admin.component.scss']
})
export class EditAdminComponent implements OnInit {
  private staffId!: number;
  public staff!: staffMember;

  constructor(private app: AppService, private aP: AdminPanelService, private route: ActivatedRoute) {
    this.route.queryParams.subscribe((params: Params) => {
      this.staffId = parseInt(params["admin"]);
    });
  }

  private async getStaff() {
    if (!this.staffId) {
      this.app.router.navigate(["/auth/staff/list"]).then();
      return;
    }

    await this.app.api.callServer("get", "/auth/staff", {id: this.staffId}).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("staff") && Array.isArray(success.result.staff) && success.result.staff.length === 1) {
        this.staff = <staffMember>success.result.staff[0];
      }
    }).catch((error: ApiQueryFail) => {
      this.app.flash.staffRetrieveFail = error.error ?? error.exception?.message ?? undefined;
    });

    if (!this.staff) {
      this.app.router.navigate(["/auth/staff/list"]).then();
      return;
    }
  }

  ngOnInit(): void {
    this.getStaff().then();

    this.aP.breadcrumbs.next([
      {page: 'Staff Control', active: true},
      {page: 'Management', active: true, icon: 'fal fa-users-crown'}
    ]);
    this.aP.titleChange.next(["Manage Account & Permissions", "Staff"]);
  }

}
