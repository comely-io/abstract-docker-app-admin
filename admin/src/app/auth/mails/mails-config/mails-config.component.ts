import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiErrorHandleOpts, AppService, PlainObject} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {ValidatorService} from "../../../../services/validatorService";
import {BehaviorSubject, Subscription} from "rxjs";
import {MdbModalService} from "mdb-angular-ui-kit/modal";
import {TotpModalComponent, totpModalControl} from "../../../shared/totp-modal/totp-modal.component";

@Component({
  selector: 'app-mails-config',
  templateUrl: './mails-config.component.html',
  styleUrls: ['./mails-config.component.scss']
})
export class MailsConfigComponent implements OnInit, OnDestroy {
  public validator: ValidatorService;
  public configUpdatedSuccess: boolean = false;
  public optUseTLS: boolean = false;

  private totpModalControl: BehaviorSubject<totpModalControl> = new BehaviorSubject<totpModalControl>({});
  private totpCodeReceived: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private totpWatch?: Subscription;
  private compiledFormData?: PlainObject;

  public formSubmit: boolean = false;
  public formDisabled: boolean = false;
  public configForm: FormGroup = new FormGroup({
    service: new FormControl(),
    senderName: new FormControl(),
    senderEmail: new FormControl(),
    timeOut: new FormControl(),
    tls: new FormControl(),
    smtpHostname: new FormControl(),
    smtpPort: new FormControl(),
    smtpUsername: new FormControl(),
    smtpPassword: new FormControl(),
    smtpServerName: new FormControl(),
    apiKey: new FormControl(),
    apiBaggageOne: new FormControl(),
    apiBaggageTwo: new FormControl()
  });

  constructor(private app: AppService, private aP: AdminPanelService, private modals: MdbModalService) {
    this.validator = app.validator;
  }

  public submitConfigForm() {
    this.configUpdatedSuccess = false;
    let inputErrors: number = 0;
    let formData: PlainObject = {
      service: "",
      senderName: "",
      senderEmail: "",
      timeOut: 0,
      useTLS: 0
    };

    // Service
    try {
      formData.service = this.validator.validateInput(this.configForm.controls.service.value, true).toLowerCase();
      if (["disabled", "paused", "smtp", "mailgun", "sendgrid"].indexOf(formData.service) < 0) {
        throw new Error('Invalid mailer service');
      }
    } catch (e) {
      this.configForm.controls.service.setErrors({message: e.message});
      inputErrors++;
    }

    // Sender Name
    try {
      formData.senderName = this.validator.validateInput(this.configForm.controls.senderName.value, true);
      if (formData.senderName.length < 3) {
        throw new Error('Sender name is too short');
      } else if (formData.senderName.length > 32) {
        throw new Error('Sender name is too long');
      }
    } catch (e) {
      this.configForm.controls.senderName.setErrors({message: e.message});
      inputErrors++;
    }

    // Sender Email
    try {
      formData.senderEmail = this.validator.validateEmail(this.configForm.controls.senderEmail.value, 64);
    } catch (e) {
      this.configForm.controls.senderEmail.setErrors({message: e.message});
      inputErrors++;
    }

    // Time Out
    try {
      formData.timeOut = parseInt(this.configForm.controls.timeOut.value);
      if (isNaN(formData.timeOut)) {
        throw new Error('Invalid timeOut value');
      }

      if (formData.timeOut < 1 || formData.timeOut > 30) {
        throw new Error('Timeout value must range between 1 and 30 seconds');
      }
    } catch (e) {
      this.configForm.controls.timeOut.setErrors({message: e.message});
      inputErrors++;
    }

    // Use TLS
    formData.tls = this.optUseTLS ? "yes" : "no";

    // SMTP Config
    if (formData.service === "smtp") {
      // Hostname
      try {
        formData["hostname"] = this.validator.isValidHostname(this.configForm.controls.smtpHostname.value);
        if (formData.hostname.length > 64) {
          throw new Error('Hostname cannot exceed 64 bytes');
        }
      } catch (e) {
        this.configForm.controls.smtpHostname.setErrors({message: e.message});
        inputErrors++;
      }

      // Port
      try {
        formData["port"] = parseInt(this.validator.validateInput(this.configForm.controls.smtpPort.value));
        if (isNaN(formData.port) || formData.port < 25 || formData.port > 65535) {
          throw new Error('Invalid SMTP server port');
        }
      } catch (e) {
        this.configForm.controls.smtpPort.setErrors({message: e.message});
        inputErrors++;
      }

      // Username
      try {
        formData["username"] = this.validator.validateInput(this.configForm.controls.smtpUsername.value);
        if (formData.username.length < 4) {
          throw new Error('Username/Login ID is too short');
        }

        if (formData.username.length > 64) {
          throw new Error('Username/Login ID cannot exceed 64 bytes');
        }
      } catch (e) {
        this.configForm.controls.smtpUsername.setErrors({message: e.message});
        inputErrors++;
      }

      // Password
      try {
        formData["password"] = this.validator.validateInput(this.configForm.controls.smtpPassword.value);
        if (formData.password.length < 4) {
          throw new Error('Password is too short');
        }

        if (formData.password.length > 64) {
          throw new Error('Password cannot exceed 64 bytes');
        }
      } catch (e) {
        this.configForm.controls.smtpPassword.setErrors({message: e.message});
        inputErrors++;
      }

      // Server Name
      try {
        formData["serverName"] = this.validator.isValidHostname(this.configForm.controls.smtpServerName.value);
        if (formData.serverName.length > 64) {
          throw new Error('Server name cannot exceed 64 bytes');
        }
      } catch (e) {
        this.configForm.controls.smtpServerName.setErrors({message: e.message});
        inputErrors++;
      }
    } else {
      if (this.isSelectedAPI()) {
        // API Key
        try {
          formData["apiKey"] = this.validator.validateInput(this.configForm.controls.apiKey.value);
          if (formData.apiKey.length < 8) {
            throw new Error('API key is too short');
          }

          if (formData.apiKey.length > 64) {
            throw new Error('API key cannot exceed 64 bytes');
          }
        } catch (e) {
          this.configForm.controls.apiKey.setErrors({message: e.message});
          inputErrors++;
        }

        // API Baggage One
        try {
          formData["apiBaggageOne"] = this.validator.validateInput(this.configForm.controls.apiBaggageOne.value, false);
          if (formData.apiBaggageOne.length > 128) {
            throw new Error('API baggage data cannot exceed 128 bytes');
          }
        } catch (e) {
          this.configForm.controls.apiBaggageOne.setErrors({message: e.message});
          inputErrors++;
        }

        // API Baggage Two
        try {
          formData["apiBaggageTwo"] = this.validator.validateInput(this.configForm.controls.apiBaggageTwo.value, false);
          if (formData.apiBaggageTwo.length > 128) {
            throw new Error('API baggage data cannot exceed 128 bytes');
          }
        } catch (e) {
          this.configForm.controls.apiBaggageTwo.setErrors({message: e.message});
          inputErrors++;
        }
      }
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    this.compiledFormData = formData;
    this.modals.open(TotpModalComponent, {
      data: {
        body: `<span class="text-info">TOTP is required to update <strong>Mailer Configuration</strong>.</span>`,
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
    this.formDisabled = true;
    this.totpModalControl.next({disabled: true, loading: true});
    await this.app.api.callServer("post", "/auth/config/mails", this.compiledFormData).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("status") && success.result.status === true) {
        this.configUpdatedSuccess = true;
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
    this.formDisabled = false;
    this.totpModalControl.next({disabled: false, loading: false});
  }

  public isSelectedAPI(): boolean {
    let current: any = this.configForm.controls.service?.value;
    if (typeof current === "string") {
      return ["mailgun", "sendgrid"].indexOf(current) >= 0;
    }

    return false;
  }

  public async loadConfig() {
    this.formDisabled = true;
    await this.app.api.callServer("get", "/auth/config/mails", {}).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("config") && typeof success.result.config === "object") {
        let mailConfig: any = success.result.config;
        this.configForm.controls.service.setValue(mailConfig.service);
        this.configForm.controls.senderName.setValue(mailConfig.senderName);
        this.configForm.controls.senderEmail.setValue(mailConfig.senderEmail);
        this.configForm.controls.timeOut.setValue(mailConfig.timeOut);
        this.optUseTLS = mailConfig.useTLS;
        this.configForm.controls.smtpHostname.setValue(mailConfig.hostname);
        this.configForm.controls.smtpPort.setValue(mailConfig.port);
        this.configForm.controls.smtpUsername.setValue(mailConfig.username);
        this.configForm.controls.smtpPassword.setValue(mailConfig.password);
        this.configForm.controls.smtpServerName.setValue(mailConfig.serverName);
        this.configForm.controls.apiKey.setValue(mailConfig.apiKey);
        this.configForm.controls.apiBaggageOne.setValue(mailConfig.apiBaggageOne);
        this.configForm.controls.apiBaggageTwo.setValue(mailConfig.apiBaggageTwo);
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

    this.formDisabled = false;
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

    // Permission check
    let canViewConfig: boolean = this.app.auth.session().admin.isRoot;
    if (!canViewConfig) {
      canViewConfig = this.app.auth.session().admin.privileges["viewConfig"];
    }

    if (!canViewConfig) {
      this.app.flash.dashboard.push(`You are not privileged to view <strong>Mailer Configuration</strong>.`);
      this.app.router.navigate(["/auth/dashboard"]).then();
      return;
    }

    this.loadConfig().then();

    // Breadcrumbs & Title
    this.aP.breadcrumbs.next([
      {page: 'Mailer', active: true, icon: 'fal fa-mailbox'},
      {page: 'Configuration', active: true}
    ]);
    this.aP.titleChange.next(["Configuration", "Mailer"]);
  }

  ngOnDestroy() {
    this.totpWatch?.unsubscribe();
  }
}
