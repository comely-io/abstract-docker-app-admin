import {Component, Input, OnInit} from '@angular/core';
import {ApiErrorHandleOpts, AppService} from "../../../../../services/appService";
import {MdbModalRef} from "mdb-angular-ui-kit/modal";
import {ValidatorService} from "../../../../../services/validatorService";
import {country} from "../countries.component";
import {BehaviorSubject} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiQueryFail, ApiSuccess} from "../../../../../services/apiService";

@Component({
  selector: 'app-countries-setup-modal',
  templateUrl: './countries-setup-modal.component.html',
  styleUrls: ['./countries-setup-modal.component.scss']
})
export class CountriesSetupModalComponent implements OnInit {
  @Input() country?: country;
  @Input() updateEvent!: BehaviorSubject<number | string | null>;

  public validator: ValidatorService;

  public formSubmit: boolean = false;
  public formDisabled: boolean = false;
  public setupCountryForm: FormGroup = new FormGroup({
    list: new FormControl(),
    name: new FormControl(),
    code: new FormControl(),
    codeShort: new FormControl(),
    dialCode: new FormControl(),
    totp: new FormControl()
  });

  constructor(private app: AppService, public modalRef: MdbModalRef<CountriesSetupModalComponent>) {
    this.validator = app.validator;
  }

  public async submitSetupForm() {
    let inputErrors: number = 0;
    let formData: any = {
      action: "setup",
      list: "",
      name: "",
      code: "",
      codeShort: "",
      dialCode: "",
      totp: ""
    };

    // Name
    try {
      let name = this.validator.validateInput(this.setupCountryForm.get("name")?.value);
      if (name.length < 3 || name.length > 32) {
        throw new Error('Name must be between 3 and 32 bytes');
      }

      formData.name = name;
    } catch (e) {
      this.setupCountryForm.get("name")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Code
    try {
      let code = this.validator.validateInput(this.setupCountryForm.get("code")?.value).toUpperCase();
      if (!/^[A-Z]{3}$/.test(code)) {
        throw new Error('Invalid ISO 3166-1 Alpha 3 code');
      }

      formData.code = code;
    } catch (e) {
      this.setupCountryForm.get("code")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Alpha-2
    try {
      let codeShort = this.validator.validateInput(this.setupCountryForm.get("codeShort")?.value).toUpperCase();
      if (!/^[A-Z]{2}$/.test(codeShort)) {
        throw new Error('Invalid ISO 3166-1 Alpha 2 code');
      }

      formData.codeShort = codeShort;
    } catch (e) {
      this.setupCountryForm.get("codeShort")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Dial Code
    try {
      let dialCode = parseInt(this.setupCountryForm.get("dialCode")?.value);
      if (isNaN(dialCode) || dialCode < 1 || dialCode > 16777215) {
        throw new Error('Invalid dial code');
      }
    } catch (e) {
      this.setupCountryForm.get("dialCode")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Totp
    try {
      formData.totp = this.app.validator.validateTotp(this.setupCountryForm.get("totp")?.value);
    } catch (e) {
      this.setupCountryForm.get("totp")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    // Clear out TOTP code
    this.setupCountryForm.get("totp")?.setValue("");

    this.formDisabled = true;
    this.formSubmit = true;
    await this.app.api.callServer("post", "/auth/countries", formData).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("status") && success.result.status === true) {
        this.updateEvent.next(formData.code);
        this.modalRef.close();
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.setupCountryForm});
    });

    this.formDisabled = false;
    this.formSubmit = false;
  }

  public totpSubmit(e: any): void {
    this.validator.parseTotpField(e, () => {
      this.submitSetupForm().then();
    });
  }

  ngOnInit(): void {
    if (this.country) {
      this.setupCountryForm.controls.list.setValue(this.country.available === 1 ? "available" : "disabled");
      this.setupCountryForm.controls.name.setValue(this.country.name);
      this.setupCountryForm.controls.code.setValue(this.country.code);
      this.setupCountryForm.controls.codeShort.setValue(this.country.codeShort);
      this.setupCountryForm.controls.dialCode.setValue(this.country.dialCode);
    }
  }
}
