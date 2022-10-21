import {Component, OnInit} from '@angular/core';
import {ApiErrorHandleOpts, AppService, PlainObject} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {FormControl, FormGroup} from "@angular/forms";
import {BehaviorSubject} from "rxjs";
import {TotpModalComponent, totpModalControl} from "../../../shared/totp-modal/totp-modal.component";
import {MdbModalService} from "mdb-angular-ui-kit/modal";

export interface ReCaptchaConfig {
  status: number,
  publicKey?: string,
  privateKey?: number
}

export interface OAuth2Vendor {
  status: boolean,
  appId?: string,
  appKey?: string
}

export interface OAuth2Vendors {
  fb?: OAuth2Vendor,
  tw?: OAuth2Vendor,
  apple?: OAuth2Vendor,
  google?: OAuth2Vendor,
}

export interface OAuth2Config {
  status: boolean,
  vendors?: OAuth2Vendors
}

export interface ProgramConfig {
  reCaptcha?: ReCaptchaConfig,
  oAuth2?: OAuth2Config
}

interface OAuth2Status {
  [key: string]: boolean
}

@Component({
  selector: 'app-program-config',
  templateUrl: './program-config.component.html',
  styleUrls: ['./program-config.component.scss']
})
export class ProgramConfigComponent implements OnInit {
  public programConfig?: ProgramConfig;

  public oAuth2UpdateSuccess: boolean = false;
  public reCaptchaUpdateSuccess: boolean = false;
  public formSubmit: boolean = false;
  public formsDisabled: boolean = false;
  private totpModalControl: BehaviorSubject<totpModalControl> = new BehaviorSubject<totpModalControl>({});
  private totpCodeReceived: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private compiledFormData?: PlainObject;

  public oAuth2Status: OAuth2Status = {
    global: false,
    apple: false,
    google: false,
    fb: false,
    tw: false,
  };

  public oAuth2Forms: FormGroup = new FormGroup({
    fbAppId: new FormControl(),
    fbAppKey: new FormControl(),
    appleAppId: new FormControl(),
    appleAppKey: new FormControl(),
    googleAppId: new FormControl(),
    googleAppKey: new FormControl(),
    twAppId: new FormControl(),
    twAppKey: new FormControl(),
  });

  public reCaptchaForms: FormGroup = new FormGroup({
    status: new FormControl(),
    publicKey: new FormControl(),
    privateKey: new FormControl()
  });

  constructor(private app: AppService, private aP: AdminPanelService, private modals: MdbModalService) {
  }

  public submitOAuth2Form() {
    if (!this.programConfig) {
      return;
    }

    this.oAuth2UpdateSuccess = false;
    let inputErrors: number = 0;
    let formData: PlainObject = {
      action: "oauth2",
      status: false
    };

    // Global status
    formData.status = this.oAuth2Status.global ? "true" : "false";

    // Vendors
    ["fb", "tw", "apple", "google"].forEach((vendor: string) => {
      let status = this.oAuth2Status[vendor] ? "true" : "false";
      let appId = this.oAuth2Forms.get(vendor + "AppId")?.value;
      if (typeof appId !== "string" || !appId.length) {
        appId = "";
      }

      let appKey = this.oAuth2Forms.get(vendor + "AppKey")?.value;
      if (typeof appKey !== "string" || !appKey.length) {
        appKey = "";
      }

      if (status === "true") {
        try {
          if (!appId.length) {
            throw new Error('This field is required when enabled');
          }
        } catch (e) {
          this.oAuth2Forms.get(vendor + "AppId")?.setErrors({message: e.message});
          inputErrors++;
        }

        try {
          if (!appKey.length) {
            throw new Error('This field is required when enabled');
          }
        } catch (e) {
          this.oAuth2Forms.get(vendor + "AppKey")?.setErrors({message: e.message});
          inputErrors++;
        }
      }

      formData[vendor + "Status"] = status;
      formData[vendor + "AppId"] = appId;
      formData[vendor + "AppKey"] = appKey;
    });

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    this.compiledFormData = formData;
    this.modals.open(TotpModalComponent, {
      data: {
        body: `<span class="text-info">TOTP is required to update <strong>OAuth2 Configuration</strong>.</span>`,
        totpModalControl: this.totpModalControl,
        totpCodeAccept: this.totpCodeReceived
      }
    });
  }

  private async loadConfig() {
    this.formsDisabled = true;
    await this.app.api.callServer("get", "/auth/config/program", {}).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("config") && typeof success.result.config === "object") {
        this.programConfig = <ProgramConfig>success.result.config;

        // OAuth2 Configs
        if (this.programConfig.oAuth2) {
          this.oAuth2Status.global = this.programConfig.oAuth2.status;
          if (this.programConfig.oAuth2.vendors) {
            this.oAuth2Status.apple = this.programConfig.oAuth2.vendors.apple?.status ?? false;
            this.oAuth2Forms.controls.appleAppId.setValue(this.programConfig.oAuth2.vendors.apple?.appId ?? "");
            this.oAuth2Forms.controls.appleAppKey.setValue(this.programConfig.oAuth2.vendors.apple?.appKey ?? "");
            this.oAuth2Status.google = this.programConfig.oAuth2.vendors.google?.status ?? false;
            this.oAuth2Forms.controls.googleAppId.setValue(this.programConfig.oAuth2.vendors.google?.appId ?? "");
            this.oAuth2Forms.controls.googleAppKey.setValue(this.programConfig.oAuth2.vendors.google?.appKey ?? "");
            this.oAuth2Status.fb = this.programConfig.oAuth2.vendors.fb?.status ?? false;
            this.oAuth2Forms.controls.fbAppId.setValue(this.programConfig.oAuth2.vendors.fb?.appId ?? "");
            this.oAuth2Forms.controls.fbAppKey.setValue(this.programConfig.oAuth2.vendors.fb?.appKey ?? "");
            this.oAuth2Status.tw = this.programConfig.oAuth2.vendors.tw?.status ?? false;
            this.oAuth2Forms.controls.twAppId.setValue(this.programConfig.oAuth2.vendors.tw?.appId ?? "");
            this.oAuth2Forms.controls.twAppKey.setValue(this.programConfig.oAuth2.vendors.tw?.appKey ?? "");
          }
        }

        // ReCaptcha Configs

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

  private async saveChanges() {
    if (!this.compiledFormData) {
      return;
    }

    if (!this.compiledFormData.hasOwnProperty("totp") || typeof this.compiledFormData.totp !== "string" || this.compiledFormData.totp.length !== 6) {
      return;
    }

    let formGroup: FormGroup | undefined = undefined;
    if (this.compiledFormData.action === "oauth2") {
      formGroup = this.oAuth2Forms;
    } else if (this.compiledFormData.action === "recaptcha") {
      formGroup = this.reCaptchaForms;
    }

    this.formSubmit = true;
    this.formsDisabled = true;
    this.totpModalControl.next({disabled: true, loading: true});
    await this.app.api.callServer("post", "/auth/config/program", this.compiledFormData).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("status") && success.result.status === true) {
        if (this.compiledFormData && this.compiledFormData.hasOwnProperty("action")) {
          if (this.compiledFormData.action === "oauth2") {
            this.oAuth2UpdateSuccess = true;
          }

          if (this.compiledFormData.action === "recaptcha") {
            this.reCaptchaUpdateSuccess = true;
          }
        }

        this.totpModalControl.next({close: true});
      }
    }).catch((error: ApiQueryFail) => {
      if (error.exception?.param === "totp") {
        this.totpModalControl.next({totpError: error.exception.message});
      } else {
        this.totpModalControl.next({close: true});
        this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: formGroup});
      }
    });

    this.formSubmit = false;
    this.formsDisabled = false;
    this.totpModalControl.next({disabled: false, loading: false});
  }

  ngOnInit(): void {
    // Events
    this.totpCodeReceived.subscribe((totpCode: string | null) => {
      if (typeof this.compiledFormData !== "object") {
        return;
      }

      this.compiledFormData.totp = totpCode;
      this.saveChanges().then();
    });

    this.loadConfig().then();

    this.aP.breadcrumbs.next([
      {page: 'Application', active: true},
      {page: 'Configuration', active: true, icon: "fal fa-cogs"}
    ]);
    this.aP.titleChange.next(["Configuration", "Application"]);
  }
}
