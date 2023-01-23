import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {ApiErrorHandleOpts, AppService, PlainObject} from "../../../../../services/appService";
import {ApiQueryFail, ApiSuccess} from "../../../../../services/apiService";
import {BehaviorSubject, Subscription} from "rxjs";
import {TotpModalComponent, totpModalControl} from "../../../../shared/totp-modal/totp-modal.component";
import {MdbModalService} from "mdb-angular-ui-kit/modal";
import {ValidatorService} from "../../../../../services/validatorService";

interface systemConfig {
  autoDbBackup: boolean | string,
  autoDbBackupHours: number,
  dbBackupPassword?: string,
  dbBackupKeepLast: number,
  adminLogsPurge: number,
  adminSessionsPurge: number,
  usersLogsPurge: number,
  publicAPIQueriesPurge: number,
  publicAPISessionsPurge: number
}

@Component({
  selector: 'app-system-config',
  templateUrl: './system-config.component.html',
  styleUrls: ['./system-config.component.scss']
})
export class SystemConfigComponent implements OnInit, OnDestroy {

  public validator: ValidatorService;
  public configUpdateSuccess: boolean = false;
  public systemConfig?: systemConfig;
  public formSubmit: boolean = false;
  public formsDisabled: boolean = false;
  private totpModalControl: BehaviorSubject<totpModalControl> = new BehaviorSubject<totpModalControl>({});
  private totpCodeReceived: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private totpWatch?: Subscription;
  private compiledFormData?: PlainObject;

  public configForm: FormGroup = new FormGroup({
    autoBackupHours: new FormControl(),
    autoBackupKeep: new FormControl(),
    autoBackupPassword: new FormControl(),
    adminLogsPurge: new FormControl(),
    adminSessionsPurge: new FormControl(),
    usersLogsPurge: new FormControl(),
    publicAPIQueriesPurge: new FormControl(),
    publicAPISessionsPurge: new FormControl()
  });

  constructor(private app: AppService, private modals: MdbModalService) {
    this.validator = this.app.validator;
  }

  public submitConfigForm() {
    if (!this.systemConfig) {
      return;
    }

    this.configUpdateSuccess = false;
    let inputErrors: number = 0;
    let formData: systemConfig = {
      autoDbBackup: "false",
      autoDbBackupHours: 0,
      dbBackupPassword: "",
      dbBackupKeepLast: 0,
      adminLogsPurge: 0,
      adminSessionsPurge: 0,
      usersLogsPurge: 0,
      publicAPIQueriesPurge: 0,
      publicAPISessionsPurge: 0
    };

    // Auto-database Backups
    formData.autoDbBackup = this.systemConfig.autoDbBackup ? "true" : "false";

    try {
      formData.dbBackupPassword = this.configForm.controls.autoBackupPassword.value;
      if (typeof formData.dbBackupPassword === "string" && formData.dbBackupPassword.length) {
        formData.dbBackupPassword = this.validator.validatePassword(formData.dbBackupPassword, "Backups Password");
      } else {
        formData.dbBackupPassword = "";
      }
    } catch (e) {
      this.configForm.controls.autoBackupPassword.setErrors({message: e.message});
      inputErrors++;
    }

    try {
      formData.autoDbBackupHours = parseInt(this.configForm.controls.autoBackupHours.value);
      if (isNaN(formData.autoDbBackupHours)) {
        throw new Error('Invalid value');
      }

      if (formData.autoDbBackupHours < 1 || formData.autoDbBackupHours > 168) {
        throw new Error('Value must be between 1 and 168 hours');
      }
    } catch (e) {
      this.configForm.controls.autoBackupHours.setErrors({message: e.message});
      inputErrors++;
    }

    try {
      formData.dbBackupKeepLast = parseInt(this.configForm.controls.autoBackupKeep.value);
      if (isNaN(formData.dbBackupKeepLast)) {
        throw new Error('Invalid value');
      }

      if (formData.dbBackupKeepLast < 10 || formData.dbBackupKeepLast > 100) {
        throw new Error('Value must be between 10 and 100 backups');
      }
    } catch (e) {
      this.configForm.controls.autoBackupKeep.setErrors({message: e.message});
      inputErrors++;
    }

    // Purges
    try {
      formData.adminLogsPurge = parseInt(this.configForm.controls.adminLogsPurge.value);
      if (isNaN(formData.adminLogsPurge)) {
        throw new Error('Invalid value');
      }

      if (formData.adminLogsPurge < 30 || formData.adminLogsPurge > 180) {
        throw new Error('Value must be between 30 and 180 days');
      }
    } catch (e) {
      this.configForm.controls.adminLogsPurge.setErrors({message: e.message});
      inputErrors++;
    }

    try {
      formData.adminSessionsPurge = parseInt(this.configForm.controls.adminSessionsPurge.value);
      if (isNaN(formData.adminSessionsPurge)) {
        throw new Error('Invalid value');
      }

      if (formData.adminSessionsPurge < 7 || formData.adminSessionsPurge > 180) {
        throw new Error('Value must be between 7 and 180 days');
      }
    } catch (e) {
      this.configForm.controls.adminSessionsPurge.setErrors({message: e.message});
      inputErrors++;
    }

    try {
      formData.usersLogsPurge = parseInt(this.configForm.controls.usersLogsPurge.value);
      if (isNaN(formData.usersLogsPurge)) {
        throw new Error('Invalid value');
      }

      if (formData.usersLogsPurge < 30 || formData.usersLogsPurge > 180) {
        throw new Error('Value must be between 30 and 180 days');
      }
    } catch (e) {
      this.configForm.controls.usersLogsPurge.setErrors({message: e.message});
      inputErrors++;
    }

    try {
      formData.publicAPIQueriesPurge = parseInt(this.configForm.controls.publicAPIQueriesPurge.value);
      if (isNaN(formData.publicAPIQueriesPurge)) {
        throw new Error('Invalid value');
      }

      if (formData.publicAPIQueriesPurge < 1 || formData.publicAPIQueriesPurge > 180) {
        throw new Error('Value must be between 1 and 180 days');
      }
    } catch (e) {
      this.configForm.controls.publicAPIQueriesPurge.setErrors({message: e.message});
      inputErrors++;
    }

    try {
      formData.publicAPISessionsPurge = parseInt(this.configForm.controls.publicAPISessionsPurge.value);
      if (isNaN(formData.publicAPISessionsPurge)) {
        throw new Error('Invalid value');
      }

      if (formData.publicAPISessionsPurge < 7 || formData.publicAPISessionsPurge > 180) {
        throw new Error('Value must be between 7 and 180 days');
      }
    } catch (e) {
      this.configForm.controls.publicAPISessionsPurge.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    this.compiledFormData = formData;
    this.modals.open(TotpModalComponent, {
      data: {
        body: `<span class="text-info">TOTP is required to update <strong>System Configuration</strong>.</span>`,
        totpModalControl: this.totpModalControl,
        totpCodeAccept: this.totpCodeReceived
      }
    });
  }

  private async saveChanges() {
    if (!this.compiledFormData) {
      return;
    }

    if (!this.compiledFormData.hasOwnProperty("totp") || typeof this.compiledFormData.totp !== "string" || this.compiledFormData.totp.length !== 6) {
      return;
    }

    this.formSubmit = true;
    this.formsDisabled = true;
    this.totpModalControl.next({disabled: true, loading: true});
    await this.app.api.callServer("post", "/auth/config/system", this.compiledFormData).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("status") && success.result.status === true) {
        this.configUpdateSuccess = true;
        this.totpModalControl.next({close: true});
      }
    }).catch((error: ApiQueryFail) => {
      if (error.exception?.param === "totp") {
        this.totpModalControl.next({totpError: error.exception.message});
      } else {
        this.totpModalControl.next({close: true});
        this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.configForm});
      }
    });

    this.formSubmit = false;
    this.formsDisabled = false;
    this.totpModalControl.next({disabled: false, loading: false});
  }

  public async loadSystemConfig() {
    this.formsDisabled = true;
    await this.app.api.callServer("get", "/auth/config/system", {}).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("config") && typeof success.result.config === "object") {
        this.systemConfig = <systemConfig>success.result.config;
        this.configForm.controls.autoBackupHours.setValue(this.systemConfig.autoDbBackupHours);
        this.configForm.controls.autoBackupKeep.setValue(this.systemConfig.dbBackupKeepLast);
        this.configForm.controls.autoBackupPassword.setValue(this.systemConfig.dbBackupPassword);
        this.configForm.controls.adminLogsPurge.setValue(this.systemConfig.adminLogsPurge);
        this.configForm.controls.adminSessionsPurge.setValue(this.systemConfig.adminSessionsPurge);
        this.configForm.controls.usersLogsPurge.setValue(this.systemConfig.usersLogsPurge);
        this.configForm.controls.publicAPIQueriesPurge.setValue(this.systemConfig.publicAPIQueriesPurge);
        this.configForm.controls.publicAPISessionsPurge.setValue(this.systemConfig.publicAPISessionsPurge);
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{
        callback: (msg: string) => {
          this.app.flash.dashboard.push(msg);
          this.app.router.navigate(["/auth/dashboard"]).then();
          return;
        }
      });
    });

    this.formsDisabled = false;
  }

  ngOnInit(): void {
    // Events
    this.totpWatch = this.totpCodeReceived.subscribe((totpCode: string | null) => {
      if (typeof this.compiledFormData !== "object") {
        return;
      }

      this.compiledFormData.totp = totpCode;
      this.saveChanges().then();
    });

    this.loadSystemConfig().then();
  }

  ngOnDestroy() {
    this.totpWatch?.unsubscribe();
  }
}
