import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup} from "@angular/forms";
import {ApiErrorHandleOpts, AppService} from "../../../../../services/appService";
import {ApiQueryFail, ApiSuccess} from "../../../../../services/apiService";

interface systemConfig {
  autoDbBackup: boolean,
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
export class SystemConfigComponent implements OnInit {

  public systemConfig?: systemConfig;
  public formsDisabled: boolean = false;
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

  constructor(private app: AppService) {
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
    this.loadSystemConfig().then();
  }
}
