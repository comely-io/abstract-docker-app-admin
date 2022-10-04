import {Component, Input, OnInit} from '@angular/core';
import {ApiErrorHandleOpts, AppService} from "../../../../../services/appService";
import {MdbModalRef} from "mdb-angular-ui-kit/modal";
import {ValidatorService} from "../../../../../services/validatorService";
import {FormControl, FormGroup} from "@angular/forms";
import {countriesListType} from "../countries-table/countries-table.component";
import {ApiQueryFail, ApiSuccess} from "../../../../../services/apiService";
import {BehaviorSubject} from "rxjs";

export interface statusChangeQuery {
  countries: Array<string>,
  list: countriesListType
}

@Component({
  selector: 'app-countries-move-modal',
  templateUrl: './countries-move-modal.component.html',
  styleUrls: ['./countries-move-modal.component.scss']
})
export class CountriesMoveModalComponent implements OnInit {
  @Input() countries!: Array<string>;
  @Input() list!: countriesListType;
  @Input() updateEvent!: BehaviorSubject<number | string | null>;

  public validator: ValidatorService;

  public formSubmit: boolean = false;
  public formDisabled: boolean = false;
  public countriesStatusForm: FormGroup = new FormGroup({
    totp: new FormControl()
  });

  constructor(public app: AppService, public modalRef: MdbModalRef<CountriesMoveModalComponent>) {
    this.validator = app.validator;
  }

  public async submitStatusForm() {
    let inputErrors: number = 0;
    let formData: any = {
      action: "status",
      countries: this.countries.join(","),
      totp: ""
    };

    // Totp
    try {
      formData.totp = this.app.validator.validateTotp(this.countriesStatusForm.get("totp")?.value);
    } catch (e) {
      this.countriesStatusForm.get("totp")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    // Clear out TOTP code
    this.countriesStatusForm.get("totp")?.setValue("");

    this.formDisabled = true;
    this.formSubmit = true;
    await this.app.api.callServer("post", "/auth/countries", formData).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("status") && success.result.status === true) {
        this.updateEvent.next(success.result.count);
        this.modalRef.close();
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.countriesStatusForm});
    });

    this.formDisabled = false;
    this.formSubmit = false;
  }

  public totpSubmit(e: any): void {
    this.validator.parseTotpField(e, () => {
      this.submitStatusForm().then();
    });
  }

  ngOnInit(): void {
    if (this.countries.length < 1) {
      this.modalRef.close();
    }
  }
}
