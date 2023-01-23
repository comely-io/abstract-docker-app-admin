import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiErrorHandleOpts, AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {ActivatedRoute, Params} from "@angular/router";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {staffMember} from "../list/list.component";
import {FormControl, FormGroup} from "@angular/forms";
import {ValidatorService} from "../../../../services/validatorService";
import {Subscription} from "rxjs";


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
export class EditAdminComponent implements OnInit, OnDestroy {
  private queryWatch?: Subscription;
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
  public resetAccSubmit: boolean = false;
  public resetAccSuccess?: string;

  /**
   * FormGroups
   */
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

  public resetAccountForm: FormGroup = new FormGroup({
    action: new FormControl(),
    totp: new FormControl()
  });

  /**
   * Controller constructor
   * @param app
   * @param aP
   * @param route
   */
  constructor(private app: AppService, private aP: AdminPanelService, private route: ActivatedRoute) {
    this.validator = app.validator;
    this.queryWatch = this.route.queryParams.subscribe((params: Params) => {
      this.staffId = parseInt(params["admin"]);
    });
  }

  /**
   * Edit status & email address
   */
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

  /**
   * Edit administrators permissions
   */
  public async submitPrivilegesForm() {
    this.editPermSuccess = false;
    let inputErrors: number = 0;
    let totp: string = "";

    // Changed permissions
    let permKeys = Object.keys(this.changePermissions);
    if (!permKeys.length) {
      this.app.notify.error('Privileges object was not loaded successfully');
      return;
    }

    let newPermsObj: any = {};
    permKeys.forEach((permKey: string) => {
      newPermsObj[permKey] = this.changePermissions[permKey] ? 1 : 0;
    });

    // Totp
    try {
      totp = this.app.validator.validateTotp(this.editPermissionsForm.get("totp")?.value);
    } catch (e) {
      this.editPermissionsForm.get("totp")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    // Clear out TOTP code
    this.editPermissionsForm.get("totp")?.setValue("");

    this.editPermSubmit = true;
    this.formsAreDisabled = true;

    await this.app.api.callServer("post", "/auth/staff/privileges", {
      id: this.staff.id,
      permissions: newPermsObj,
      totp: totp,
    }).then(() => {
      this.editPermSuccess = true;
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.editPermissionsForm});
    });

    this.editPermSubmit = false;
    this.formsAreDisabled = false;
  }

  public editPermTotpType(e: any) {
    this.validator.parseTotpField(e, () => {
      this.submitPrivilegesForm().then();
    });
  }

  public togglePermission(id: string): void {
    this.changePermissions[id] = !(this.changePermissions.hasOwnProperty(id) && this.changePermissions[id]);
  }

  /**
   * Edit account password
   */
  public async submitPasswordForm() {
    this.changePwSuccess = false;
    let inputErrors: number = 0;
    let tempPassword: string = "",
      totp: string = "";

    // Password
    try {
      tempPassword = this.app.validator.validatePassword(this.changePasswordForm.get("tempPassword")?.value, "Temporary password")
    } catch (e) {
      this.changePasswordForm.get("tempPassword")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Totp
    try {
      totp = this.app.validator.validateTotp(this.changePasswordForm.get("totp")?.value);
    } catch (e) {
      this.changePasswordForm.get("totp")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    // Clear out TOTP code
    this.changePasswordForm.get("totp")?.setValue("");

    this.changePwSubmit = true;
    this.formsAreDisabled = true;

    await this.app.api.callServer("post", "/auth/staff/reset", {
      id: this.staff.id,
      action: "password",
      tempPassword: tempPassword,
      totp: totp,
    }).then(() => {
      this.changePwSuccess = true;
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.changePasswordForm});
    });

    this.changePwSubmit = false;
    this.formsAreDisabled = false;
  }

  public changePwTotpType(e: any) {
    this.validator.parseTotpField(e, () => {
      this.submitPasswordForm().then();
    });
  }

  /**
   * Reset account
   */
  public async submitResetAccForm() {
    this.resetAccSuccess = undefined;
    let inputErrors: number = 0;
    let action: string | undefined | null,
      totp: string = "";

    // Action
    try {
      action = this.resetAccountForm.get("action")?.value;
      if (typeof action !== "string" || ["2fa", "checksum", "privileges"].indexOf(action) <= -1) {
        throw new Error('Invalid execute action');
      }
    } catch (e) {
      this.resetAccountForm.get("action")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Totp
    try {
      totp = this.app.validator.validateTotp(this.resetAccountForm.get("totp")?.value);
    } catch (e) {
      this.resetAccountForm.get("totp")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    // Clear out TOTP code
    this.resetAccountForm.get("totp")?.setValue("");

    this.resetAccSubmit = true;
    this.formsAreDisabled = true;

    await this.app.api.callServer("post", "/auth/staff/reset", {
      id: this.staff.id,
      action: action,
      totp: totp,
    }).then((result: ApiSuccess) => {
      this.resetAccSuccess = "Command executed successfully!";
      if (result.result.hasOwnProperty("success")) {
        if (typeof result.result.success === "string" && result.result.success.length) {
          this.resetAccSuccess = result.result.success;
        }
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.resetAccountForm});
    });

    this.resetAccSubmit = false;
    this.formsAreDisabled = false;
  }

  public resetAccTotpType(e: any) {
    this.validator.parseTotpField(e, () => {
      this.submitResetAccForm().then();
    });
  }

  /**
   * Load staff account and permissions
   * @private
   */
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

  /**
   * Permissions legend and display highlights
   */
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

  /**
   * Controller initialize
   */
  ngOnInit(): void {
    this.loadStaffAccount().then();

    this.aP.breadcrumbs.next([
      {page: 'Staff Control', active: true},
      {page: 'Management', active: true, icon: 'fal fa-users-crown'}
    ]);
    this.aP.titleChange.next(["Manage Account & Permissions", "Staff"]);
  }

  ngOnDestroy() {
    this.queryWatch?.unsubscribe();
  }
}
