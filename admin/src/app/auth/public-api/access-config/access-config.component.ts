import {Component, OnInit} from '@angular/core';
import {AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {ValidatorService} from "../../../../services/validatorService";
import {MdbModalService} from "mdb-angular-ui-kit/modal";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {TotpModalComponent, totpModalControl} from "../../../shared/totp-modal/totp-modal.component";
import {BehaviorSubject} from "rxjs";

interface configTriggers {
  [key: string]: boolean
}

interface triggerLabels {
  [key: string]: triggerLabel
}

interface triggerLabel {
  label: string,
  icon?: string
}

@Component({
  selector: 'app-access-config',
  templateUrl: './access-config.component.html',
  styleUrls: ['./access-config.component.scss']
})
export class AccessConfigComponent implements OnInit {
  public totpUpdateSuccess: boolean = false;
  public formDisabled: boolean = false;

  private totpModalControl: BehaviorSubject<totpModalControl> = new BehaviorSubject<totpModalControl>({});
  private totpCodeReceived: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  public validator: ValidatorService;
  public configTriggers?: configTriggers;

  public labels: triggerLabels = {
    "globalStatus": {label: "Global Status"},
    "signUp": {label: "Registration of new users.", icon: "fal fa-users"},
    "signIn": {label: "Signing into accounts.", icon: "fal fa-lock"},
    "recoverPassword": {label: "Passwords recovery.", icon: "fal fa-key"}
  };

  constructor(private app: AppService, private aP: AdminPanelService, private modals: MdbModalService) {
    this.validator = app.validator;
  }

  public saveChangesClick(): void {
    this.totpUpdateSuccess = false;
    this.modals.open(TotpModalComponent, {
      data: {
        body: `<span class="text-info">TOTP is required to update <strong>Public API Access Configuration</strong>.</span>`,
        totpModalControl: this.totpModalControl,
        totpCodeAccept: this.totpCodeReceived
      }
    });
  }

  public switchTrigger(name: string) {
    if (!this.configTriggers) {
      return;
    }

    if (this.configTriggers.hasOwnProperty(name)) {
      this.configTriggers[name] = !this.configTriggers[name];
    }
  }

  private async saveChanges(totpCode: string) {
    if (!this.configTriggers) {
      return;
    }

    let configTriggers: configTriggers = this.configTriggers;
    console.log(configTriggers);
    let formData: any = {};
    Object.keys(configTriggers).forEach((trigger: string) => {
      console.log(trigger);
      console.log(configTriggers[trigger]);
      formData[trigger] = configTriggers[trigger] ? "true" : "false";
    });

    formData["totp"] = totpCode;

    this.formDisabled = true;
    this.totpModalControl.next({disabled: true, loading: true});
    await this.app.api.callServer("post", "/auth/public_api/access", formData).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("status") && success.result.status === true) {
        this.totpUpdateSuccess = true;
        this.totpModalControl.next({close: true});
      }
    }).catch((error: ApiQueryFail) => {
      if (error.exception?.param === "totp") {
        this.totpModalControl.next({totpError: error.exception.message});
      } else {
        this.totpModalControl.next({close: true});
        this.app.handleAPIError(error);
      }
    });


    this.formDisabled = false;
    this.totpModalControl.next({disabled: false, loading: false});
  }

  public hasIcon(triggerId: string): boolean {
    if (this.labels.hasOwnProperty(triggerId)) {
      if (this.labels[triggerId].icon) {
        return true;
      }
    }

    return false;
  }

  public getIcon(triggerId: string): string {
    if (this.labels.hasOwnProperty(triggerId)) {
      if (this.labels[triggerId].icon) {
        return this.labels[triggerId].icon ?? "fal fa-globe";
      }
    }

    return "fal fa-globe";
  }

  public getLabel(triggerId: string): string {
    if (this.labels.hasOwnProperty(triggerId)) {
      return this.labels[triggerId].label;
    }

    return triggerId;
  }

  public async loadConfig() {
    this.formDisabled = true;
    await this.app.api.callServer("get", "/auth/public_api/access", {}).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("config") && typeof success.result.config === "object") {
        this.configTriggers = <configTriggers>success.result.config;
        if (this.configTriggers.hasOwnProperty("cachedOn")) {
          delete this.configTriggers["cachedOn"];
        }
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });

    this.formDisabled = false;
  }

  ngOnInit(): void {
    // Events
    this.totpCodeReceived.subscribe((totpCode: string | null) => {
      if (totpCode) {
        this.saveChanges(totpCode).then();
      }
    });

    this.loadConfig().then();

    // Breadcrumbs & Title
    this.aP.breadcrumbs.next([
      {page: 'Public API', active: true, icon: 'fal fa-globe'},
      {page: 'Access Configuration', active: true}
    ]);
    this.aP.titleChange.next(["Access Configuration", "Public API"]);
  }
}
