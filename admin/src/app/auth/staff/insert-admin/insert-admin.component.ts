import {Component, OnInit} from '@angular/core';
import {ApiErrorHandleOpts, AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {FormControl, FormGroup} from "@angular/forms";
import {ValidatorService} from "../../../../services/validatorService";
import {UtilsService} from "../../../../services/utilsService";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";

export interface createdAdmin {
  id: number,
  email: string,
  tempPass: string
}

@Component({
  selector: 'app-insert-admin',
  templateUrl: './insert-admin.component.html',
  styleUrls: ['./insert-admin.component.scss']
})
export class InsertAdminComponent implements OnInit {
  public isRootAdmin: boolean = false;
  public formIsLoading: boolean = true;
  public suggestedPassword: string = "";
  public createdAdminAcc?: createdAdmin;
  public validator: ValidatorService;
  public insertForm: FormGroup = new FormGroup({
    email: new FormControl(),
    tempPassword: new FormControl(),
    totp: new FormControl()
  });

  constructor(private app: AppService, private aP: AdminPanelService) {
    this.validator = app.validator;
  }

  public async submitInsertForm() {
    let inputErrors: number = 0;
    let email: string = "",
      tempPassword: string = "",
      totp: string = "";

    // E-mail address
    try {
      email = this.app.validator.validateEmail(this.insertForm.get("email")?.value);
    } catch (e) {
      this.insertForm.get("email")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Password
    try {
      tempPassword = this.app.validator.validatePassword(this.insertForm.get("tempPassword")?.value, "Temporary password")
    } catch (e) {
      this.insertForm.get("tempPassword")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Totp
    try {
      totp = this.app.validator.validateTotp(this.insertForm.get("totp")?.value);
    } catch (e) {
      this.insertForm.get("totp")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    // Clear out TOTP code
    this.insertForm.get("totp")?.setValue("");

    this.formIsLoading = true;
    await this.app.api.callServer("post", "/auth/staff/insert", {
      email: email,
      tempPassword: tempPassword,
      totp: totp
    }).then((success: ApiSuccess) => {
      let result = success.result;
      if (result.hasOwnProperty("adminId") && typeof result.adminId === "number" && result.adminId > 0) {
        this.createdAdminAcc = <createdAdmin>{
          id: result.adminId,
          email: email,
          tempPass: tempPassword
        };
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.insertForm});
    });

    this.formIsLoading = false;
  }

  public totpSubmit(e: any): void {
    this.validator.parseTotpField(e, () => {
      this.submitInsertForm().then();
    });
  }

  ngOnInit(): void {
    this.formIsLoading = false;
    this.insertForm.get("tempPassword")?.setValue(UtilsService.randomPassword(12, false));
    this.isRootAdmin = this.app.auth.session().admin.isRoot;
    this.aP.breadcrumbs.next([
      {page: 'Staff Control', active: true},
      {page: 'Create Admin', active: true, icon: 'fal fa-users-crown'}
    ]);
    this.aP.titleChange.next(["Create new administrator", "Staff"]);
  }
}
