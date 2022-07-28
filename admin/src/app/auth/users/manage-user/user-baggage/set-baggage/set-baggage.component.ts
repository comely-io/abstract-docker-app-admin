import {Component, Input, OnInit} from '@angular/core';
import {ApiErrorHandleOpts, AppService} from "../../../../../../services/appService";
import {MdbModalRef} from "mdb-angular-ui-kit/modal";
import {FormControl, FormGroup} from "@angular/forms";
import {ValidatorService} from "../../../../../../services/validatorService";
import {ApiQueryFail, ApiSuccess} from "../../../../../../services/apiService";
import {userBaggageItem} from "../user-baggage.component";

@Component({
  selector: 'app-set-baggage',
  templateUrl: './set-baggage.component.html',
  styleUrls: ['./set-baggage.component.scss']
})
export class SetBaggageComponent implements OnInit {
  @Input() userId!: number;
  @Input() item?: userBaggageItem;

  public validator: ValidatorService;

  public formIsLoading: boolean = false;
  public setForm: FormGroup = new FormGroup({
    keyId: new FormControl(""),
    data: new FormControl(""),
    totp: new FormControl("")
  });

  constructor(private app: AppService, public modalRef: MdbModalRef<SetBaggageComponent>) {
    this.validator = app.validator;
  }

  public async submitSetForm() {
    let inputErrors: number = 0;
    let setData: any = {
      user: this.userId,
      key: "",
      value: "",
      totp: ""
    };

    // Key
    try {
      let key = this.validator.validateInput(this.setForm.get("keyId")?.value, true);
      let keyLen = key.length;
      if (keyLen > 32) {
        throw new Error('Baggage item keys cannot exceed 32 bytes');
      }

      if (!/^[\w\-.]+$/.test(key)) {
        throw new Error('Baggage item key contains an illegal character');
      }

      setData.key = key;
    } catch (e) {
      this.setForm.get("keyId")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Data
    try {
      let data = this.validator.validateInput(this.setForm.get("data")?.value, true);
      let dataLen = data.length;
      if (dataLen > 1024) {
        throw new Error('Baggage item value cannot exceed 32 bytes');
      }

      setData.value = data;
    } catch (e) {
      this.setForm.get("data")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Totp
    try {
      setData.totp = this.app.validator.validateTotp(this.setForm.get("totp")?.value);
    } catch (e) {
      this.setForm.get("totp")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    // Clear out TOTP code
    this.setForm.get("totp")?.setValue("");

    this.formIsLoading = true;
    await this.app.api.callServer("post", "/auth/users/baggage", setData).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("status") && success.result.status === true) {
        this.app.notify.success("User baggage updated");
        this.modalRef.close({reloadBaggage: true});
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.setForm});
    });

    this.formIsLoading = false;
  }

  public totpSubmit(e: any): void {
    this.validator.parseTotpField(e, () => {
      this.submitSetForm().then();
    });
  }

  ngOnInit(): void {
    if (this.item) {
      this.setForm.controls.keyId.setValue(this.item.key);
      this.setForm.controls.data.setValue(this.item.data);
    }
  }
}
