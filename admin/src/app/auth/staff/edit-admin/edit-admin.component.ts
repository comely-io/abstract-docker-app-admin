import {Component, OnInit} from '@angular/core';
import {ApiErrorHandleOpts, AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {ActivatedRoute, Params} from "@angular/router";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {staffMember} from "../list/list.component";
import {FormControl, FormGroup} from "@angular/forms";
import {ValidatorService} from "../../../../services/validatorService";


interface permissionEntity {
  name: string,
  desc?: string | null | undefined,
  current: boolean,
  type: number
}

interface permissionChange {
  [key: string]: boolean
}

@Component({
  selector: 'app-edit-admin',
  templateUrl: './edit-admin.component.html',
  styleUrls: ['./edit-admin.component.scss']
})
export class EditAdminComponent implements OnInit {
  private staffId!: number;
  public staff!: staffMember;
  public loadedPermissions?: Map<string, permissionEntity>;
  public changePermissions: permissionChange = {};

  public validator: ValidatorService;
  public formsAreDisabled: boolean = true;
  public editAccountSubmit: boolean = false;
  public editAccountSuccess: boolean = false;
  public changePwSubmit: boolean = false;
  public changePwSuccess: boolean = false;
  public editPermSubmit: boolean = false;
  public editPermSuccess: boolean = false;

  public editAccountForm: FormGroup = new FormGroup({
    status: new FormControl(),
    email: new FormControl(),
    totp: new FormControl()
  });

  public changePasswordForm: FormGroup = new FormGroup({
    tempPassword: new FormControl(),
    totp: new FormControl()
  });

  public editPermissionsForm: FormGroup = new FormGroup({
    totp: new FormControl()
  });

  constructor(private app: AppService, private aP: AdminPanelService, private route: ActivatedRoute) {
    this.validator = app.validator;
    this.route.queryParams.subscribe((params: Params) => {
      this.staffId = parseInt(params["admin"]);
    });
  }

  public async submitEditAccountForm() {
    this.editAccountSuccess = false;

    let inputErrors: number = 0;
    let email: string = "",
      status: string,
      totp: string = "";

    // Status
    status = this.editAccountForm.get("status")?.value === "1" ? "true" : "false";

    // E-mail address
    try {
      email = this.app.validator.validateEmail(this.editAccountForm.get("email")?.value);
    } catch (e) {
      this.editAccountForm.get("email")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Totp
    try {
      totp = this.app.validator.validateTotp(this.editAccountForm.get("totp")?.value);
    } catch (e) {
      this.editAccountForm.get("totp")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    // Clear out TOTP code
    this.editAccountForm.get("totp")?.setValue("");

    this.editAccountSubmit = true;
    this.formsAreDisabled = true;

    await this.app.api.callServer("post", "/auth/staff/reset", {
      id: this.staff.id,
      action: "account",
      enabled: status,
      email: email,
      totp: totp,
    }).then(() => {
      this.editAccountSuccess = true;
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.editAccountForm});
    });

    this.editAccountSubmit = false;
    this.formsAreDisabled = false;
  }

  public editAccountTotpType(e: any) {
    this.validator.parseTotpField(e, () => {
      this.submitEditAccountForm().then();
    });
  }

  public changePwTotpType(e: any) {

  }

  public editPermTotpType(e: any) {

  }

  private async loadStaffAccount() {
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

    this.formsAreDisabled = false;
    this.editAccountForm.controls.status.setValue(this.staff.status ? "1" : "0");
    this.editAccountForm.controls.email.setValue(this.staff.email);

    this.loadPermissions().then();
  }

  private async loadPermissions() {
    if (!this.staff) {
      return;
    }

    if (this.staff.isRoot) {
      return;
    }

    await this.app.api.callServer("get", "/auth/staff/privileges", {id: this.staff.id}).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("permissions") && typeof success.result.permissions === "object") {
        this.loadedPermissions = success.result.permissions;
        Object.keys(success.result.permissions).forEach((key: string) => {
          this.changePermissions[key] = success.result.permissions[key].current ?? false;
        });
      }
    }).catch((error: ApiQueryFail) => {
      this.app.flash.staffRetrieveFail = error.error ?? error.exception?.message ?? undefined;
    });

    if (!this.loadedPermissions) {
      this.app.router.navigate(["/auth/staff/list"]).then();
      return;
    }
  }

  public togglePermission(id: string): void {
    this.changePermissions[id] = !(this.changePermissions.hasOwnProperty(id) && this.changePermissions[id]);
    console.log(this.changePermissions);
  }

  public permissionLegend(type: number): string {
    if (type === 2) {
      return 'fal fa-exclamation-circle ms-2';
    } else if (type === 1) {
      return 'fal fa-exclamation-circle ms-2';
    }

    return '';
  }

  public permissionColor(type: number): string {
    if (type === 2) {
      return "text-danger";
    } else if (type === 1) {
      return "text-warning";
    }

    return "";
  }

  ngOnInit(): void {
    this.loadStaffAccount().then();

    this.aP.breadcrumbs.next([
      {page: 'Staff Control', active: true},
      {page: 'Management', active: true, icon: 'fal fa-users-crown'}
    ]);
    this.aP.titleChange.next(["Manage Account & Permissions", "Staff"]);
  }

}
