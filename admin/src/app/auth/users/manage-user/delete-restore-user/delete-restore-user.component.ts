import {Component, Input, OnInit} from '@angular/core';
import {ApiErrorHandleOpts, AppService} from "../../../../../services/appService";
import {MdbModalRef} from "mdb-angular-ui-kit/modal";
import {DeleteGroupComponent} from "../../user-groups/delete-group/delete-group.component";
import {userAccount} from "../manage-user.component";
import {FormControl, FormGroup} from "@angular/forms";
import {ValidatorService} from "../../../../../services/validatorService";
import {ApiQueryFail, ApiSuccess} from "../../../../../services/apiService";
import {BehaviorSubject} from "rxjs";

@Component({
  selector: 'app-delete-restore-user',
  templateUrl: './delete-restore-user.component.html',
  styleUrls: ['./delete-restore-user.component.scss']
})
export class DeleteRestoreUserComponent implements OnInit {
  @Input() user!: userAccount;
  @Input() updateEvent!: BehaviorSubject<boolean | null>;

  public validator: ValidatorService;

  public formSubmit: boolean = false;
  public formDisabled: boolean = false;
  public deleteRestoreForm: FormGroup = new FormGroup({
    totp: new FormControl()
  });

  constructor(public app: AppService, public modalRef: MdbModalRef<DeleteGroupComponent>) {
    this.validator = app.validator;
  }

  public async submitDeleteRestore() {
    let inputErrors: number = 0;
    let formData: any = {
      user: this.user.id,
      action: this.user.archived === 0 ? "delete" : "restore",
      totp: ""
    };

    // Totp
    try {
      formData.totp = this.app.validator.validateTotp(this.deleteRestoreForm.get("totp")?.value);
    } catch (e) {
      this.deleteRestoreForm.get("totp")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    // Clear out TOTP code
    this.deleteRestoreForm.get("totp")?.setValue("");

    this.formDisabled = true;
    this.formSubmit = true;
    this.app.api.callServer("post", "/auth/users/user", formData).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("status") && success.result.status === true) {
        this.updateEvent.next(formData.action === "delete");
        this.modalRef.close();
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.deleteRestoreForm});
    });

    this.formDisabled = false;
    this.formSubmit = false;
  }

  public totpSubmit(e: any): void {
    this.validator.parseTotpField(e, () => {
      this.submitDeleteRestore().then();
    });
  }

  ngOnInit(): void {
  }
}
