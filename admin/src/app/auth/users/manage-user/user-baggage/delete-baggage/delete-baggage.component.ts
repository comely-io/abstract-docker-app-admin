import {Component, Input, OnInit} from '@angular/core';
import {ValidatorService} from "../../../../../../services/validatorService";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiErrorHandleOpts, AppService} from "../../../../../../services/appService";
import {MdbModalRef} from "mdb-angular-ui-kit/modal";
import {ApiQueryFail, ApiSuccess} from "../../../../../../services/apiService";

@Component({
  selector: 'app-delete-baggage',
  templateUrl: './delete-baggage.component.html',
  styleUrls: ['./delete-baggage.component.scss']
})
export class DeleteBaggageComponent implements OnInit {
  @Input() userId!: number;
  @Input() item!: string;

  public validator: ValidatorService;

  public formIsLoading: boolean = false;
  public deleteForm: FormGroup = new FormGroup({
    totp: new FormControl("")
  });

  constructor(private app: AppService, public modalRef: MdbModalRef<DeleteBaggageComponent>) {
    this.validator = app.validator;
  }

  public async submitDeleteForm() {
    let inputErrors: number = 0;
    let formData: any = {
      user: this.userId,
      key: this.item,
      totp: ""
    };

    // Totp
    try {
      formData.totp = this.app.validator.validateTotp(this.deleteForm.get("totp")?.value);
    } catch (e) {
      this.deleteForm.get("totp")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    // Clear out TOTP code
    this.deleteForm.get("totp")?.setValue("");

    this.formIsLoading = true;
    await this.app.api.callServer("delete", "/auth/users/baggage", formData).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("status") && success.result.status === true) {
        this.modalRef.close({reloadBaggage: true});
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.deleteForm});
    });

    this.formIsLoading = false;
  }

  public totpSubmit(e: any): void {
    this.validator.parseTotpField(e, () => {
      this.submitDeleteForm().then();
    });
  }

  ngOnInit(): void {
  }
}
