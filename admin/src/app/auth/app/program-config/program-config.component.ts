import {Component, OnInit} from '@angular/core';
import {ApiErrorHandleOpts, AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {FormControl, FormGroup} from "@angular/forms";

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

@Component({
  selector: 'app-program-config',
  templateUrl: './program-config.component.html',
  styleUrls: ['./program-config.component.scss']
})
export class ProgramConfigComponent implements OnInit {
  public programConfig?: ProgramConfig;
  public formsDisabled: boolean = false;

  public oA2AppleStatus: boolean = false;
  public oA2GoogleStatus: boolean = false;
  public oA2FbStatus: boolean = false;
  public oA2TwStatus: boolean = false;

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

  constructor(private app: AppService, private aP: AdminPanelService) {
  }

  private async loadConfig() {
    this.formsDisabled = true;
    await this.app.api.callServer("get", "/auth/config/program", {}).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("config") && typeof success.result.config === "object") {
        this.programConfig = <ProgramConfig>success.result.config;
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
    this.loadConfig().then();

    this.aP.breadcrumbs.next([
      {page: 'Application', active: true},
      {page: 'Configuration', active: true, icon: "fal fa-cogs"}
    ]);
    this.aP.titleChange.next(["Configuration", "Application"]);
  }
}
