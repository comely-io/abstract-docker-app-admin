import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {AppService} from "../../../services/appService";
import {MdbModalRef} from "mdb-angular-ui-kit/modal";
import {FormControl, FormGroup} from "@angular/forms";
import {ValidatorService} from "../../../services/validatorService";
import {BehaviorSubject, Subscription} from "rxjs";

export interface totpModalControl {
  totpError?: string,
  disabled?: boolean,
  loading?: boolean,
  close?: boolean
}

@Component({
  selector: 'app-totp-modal',
  templateUrl: './totp-modal.component.html',
  styleUrls: ['./totp-modal.component.scss']
})
export class TotpModalComponent implements OnInit, OnDestroy {
  @Input() body!: string;
  @Input() totpModalControl!: BehaviorSubject<totpModalControl>;
  @Input() totpCodeAccept!: BehaviorSubject<string | null>;

  private watchTotpControl?: Subscription;

  public formDisabled: boolean = false;
  public formSubmit: boolean = false;
  public validator: ValidatorService;
  public totpForm: FormGroup = new FormGroup({
    totp: new FormControl()
  });

  constructor(private app: AppService, public modalRef: MdbModalRef<TotpModalComponent>) {
    this.validator = app.validator;
  }

  public submitTotpForm() {
    if (this.formSubmit || this.formDisabled) {
      return;
    }

    let inputErrors: number = 0;
    let totpCode: string = "";

    // Totp
    try {
      totpCode = this.validator.validateTotp(this.totpForm.controls.totp.value);
    } catch (e) {
      this.totpForm.get("totp")?.setErrors({message: e.message});
      inputErrors++;
    }

    if (inputErrors !== 0) {
      return;
    }

    this.totpCodeAccept.next(totpCode);
  }

  public totpSubmit(e: any): void {
    this.app.validator.parseTotpField(e, () => {
      this.submitTotpForm();
    });
  }

  ngOnInit(): void {
    this.watchTotpControl = this.totpModalControl.subscribe((control: totpModalControl) => {
      if (typeof control.totpError === "string" && control.totpError.length) {
        this.totpForm.controls.totp.setErrors({message: control.totpError});
      }

      if (typeof control.disabled === "boolean") {
        this.formDisabled = control.disabled;
      }

      if (typeof control.loading === "boolean") {
        this.formSubmit = control.loading;
      }

      if (typeof control.close === "boolean") {
        if (control.close) {
          this.modalRef.close();
        }
      }
    });
  }

  ngOnDestroy() {
    this.watchTotpControl?.unsubscribe();
  }
}
