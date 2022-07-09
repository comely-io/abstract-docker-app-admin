import {Component, OnInit} from '@angular/core';
import {ApiErrorHandleOpts, AppService} from "../../../../services/appService";
import {ValidatorService} from "../../../../services/validatorService";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {userGroup} from "../user-groups/user-groups.component";
import {AdminPanelService} from "../../../../services/adminPanelService";

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent implements OnInit {
  public usersGroups: Array<userGroup> = [];
  public validator: ValidatorService;

  public createAccountSuccess: boolean = false;
  public formIsLoading: boolean = false;
  public formIsDisabled: boolean = true;
  public createUserForm: FormGroup = new FormGroup({
    group: new FormControl("0"),
    username: new FormControl(),
    email: new FormControl(),
    phone: new FormControl(),
    totp: new FormControl()
  });

  constructor(private app: AppService, private aP: AdminPanelService) {
    this.validator = app.validator;
  }

  public async fetchGroups() {
    this.usersGroups = [];
    this.formIsDisabled = true;

    await this.app.api.callServer("get", "/auth/users/groups", {}).then((success: ApiSuccess) => {
      this.usersGroups = success.result.groups;
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });

    this.formIsDisabled = false;
  }

  public async submitCreateForm() {
    this.formIsDisabled = true;
    let inputErrors: number = 0,
      groupId: number = 0,
      username: string = "",
      email: string | null = null,
      phone: string | null = null,
      totp: string = "";

    // Group
    try {
      groupId = parseInt(this.createUserForm.get("group")?.value);
      if (!(groupId > 0 && groupId < Number.MAX_SAFE_INTEGER)) {
        throw new Error('Select a users group');
      }
    } catch (e) {
      this.createUserForm.get("group")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Username
    try {
      username = this.validator.validateUsername(this.createUserForm.get("username")?.value);
    } catch (e) {
      this.createUserForm.get("username")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Email
    try {
      email = this.createUserForm.get("email")?.value;
      if (!email || !email.length) {
        email = null;
      } else {
        email = this.validator.validateEmail(email, 64);
      }
    } catch (e) {
      this.createUserForm.get("email")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Phone
    try {
      phone = this.createUserForm.get("phone")?.value;
      if (!phone || !phone.length) {
        phone = null;
      } else {
        if (!this.validator.isValidPhNum(phone)) {
          throw new Error('Invalid phone number');
        }
      }
    } catch (e) {
      this.createUserForm.get("phone")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Totp
    try {
      totp = this.app.validator.validateTotp(this.createUserForm.get("totp")?.value);
    } catch (e) {
      this.createUserForm.get("totp")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      this.formIsDisabled = false;
      return;
    }

    // Clear out TOTP code
    this.createUserForm.get("totp")?.setValue("");

    let createdUserId: number = 0;
    this.formIsLoading = true;
    await this.app.api.callServer("put", "/auth/users/user", {
      groupId: groupId,
      username: username,
      email: email ?? "",
      phone: phone ?? "",
      totp: totp
    }).then((success: ApiSuccess) => {
      this.formIsDisabled = true;
      if (success.result.hasOwnProperty("id") && typeof success.result.id === "number") {
        createdUserId = success.result.id;
        this.createAccountSuccess = true;
      }
    }).catch((error: ApiQueryFail) => {
      this.formIsDisabled = false;
      this.formIsLoading = false;
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.createUserForm});
    });

    if (createdUserId > 0) {
      setTimeout(() => {
        this.app.router.navigate(["/auth/users/manage"], {queryParams: {id: createdUserId}}).then();
      }, 2000);
      return;
    }
  }

  public totpSubmit(e: any): void {
    this.validator.parseTotpField(e, () => {
      this.submitCreateForm().then();
    });
  }

  ngOnInit(): void {
    this.fetchGroups().then();

    this.aP.breadcrumbs.next([
      {page: 'Users Control', icon: 'fal fa-users', active: true},
      {page: 'Create User', active: true}
    ]);
    this.aP.titleChange.next(["Create User Account", "Users"]);
  }
}
