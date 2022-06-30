import {Component, OnInit} from '@angular/core';
import {MdbModalRef} from "mdb-angular-ui-kit/modal";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiErrorHandleOpts, AppService} from "../../../../../services/appService";
import {ValidatorService} from "../../../../../services/validatorService";
import {ApiQueryFail, ApiSuccess} from "../../../../../services/apiService";

@Component({
  selector: 'app-create-group',
  templateUrl: './create-group.component.html',
  styleUrls: ['./create-group.component.scss']
})
export class CreateGroupComponent implements OnInit {
  public formIsLoading: boolean = false;
  public validator: ValidatorService;

  public createGroupForm: FormGroup = new FormGroup({
    name: new FormControl(),
    totp: new FormControl()
  });

  constructor(public app: AppService, public modalRef: MdbModalRef<CreateGroupComponent>) {
    this.validator = app.validator;
  }

  public async submitCreateForm() {
    let inputErrors: number = 0;
    let name: string = "",
      totp: string = "";

    // Name
    try {
      name = this.createGroupForm.get("name")?.value;
      if (!name || !name.length) {
        throw new Error('Group label is required');
      }

      if (!/^[a-z\-_.]+(\s[a-z\-_.]+)*$/i.test(name)) {
        throw new Error('Invalid group name');
      }

      if (name.length < 3 || name.length > 32) {
        throw new Error('Group name cannot exceed 32 bytes in length');
      }
    } catch (e) {
      this.createGroupForm.get("name")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Totp
    try {
      totp = this.app.validator.validateTotp(this.createGroupForm.get("totp")?.value);
    } catch (e) {
      this.createGroupForm.get("totp")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    // Clear out TOTP code
    this.createGroupForm.get("totp")?.setValue("");

    this.formIsLoading = true;
    await this.app.api.callServer("put", "/auth/users/groups", {
      name: name,
      totp: totp
    }).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("status") && success.result.status === true) {
        this.app.events.usersGroupReload().next(null);
        this.modalRef.close();
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.createGroupForm});
    })
    this.formIsLoading = false;
  }

  public totpSubmit(e: any): void {
    this.validator.parseTotpField(e, () => {
      this.submitCreateForm().then();
    });
  }

  ngOnInit(): void {
  }

}
