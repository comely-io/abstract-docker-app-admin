import {Component, OnInit} from '@angular/core';
import {ApiErrorHandleOpts, AppService, PlainObject} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {FormControl, FormGroup} from "@angular/forms";
import {MdbModalService} from "mdb-angular-ui-kit/modal";
import {BehaviorSubject} from "rxjs";
import {TotpModalComponent, totpModalControl} from "../../../shared/totp-modal/totp-modal.component";

interface DbConfigObject {
  driver: string,
  host: string,
  port: string | null | number | undefined,
  name: string,
  label?: string
}

interface DbConfig {
  [key: string]: DbConfigObject
}

interface DbBackup {
  id: number,
  manual: number,
  db: string,
  epoch: number,
  filename: string,
  size: number
}


@Component({
  selector: 'app-db-backups',
  templateUrl: './db-backups.component.html',
  styleUrls: ['./db-backups.component.scss']
})
export class DbBackupsComponent implements OnInit {
  public formDisabled: boolean = false;
  public formSubmit: boolean = false;

  public mySqlDbs?: Array<DbConfigObject>;
  public backupsPrivilege: boolean = false;
  public backupQueueBusy: boolean = false;
  public backupFormSuccess: boolean = false;
  public backupDeleted: boolean = false;
  private totpModalControl: BehaviorSubject<totpModalControl> = new BehaviorSubject<totpModalControl>({});
  private totpCodeReceived: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);
  private compiledFormData?: PlainObject;

  public dbBackups?: Array<DbBackup>;
  public dbConfig?: DbConfig;
  public dbBackupForm: FormGroup = new FormGroup({
    database: new FormControl()
  });

  constructor(private app: AppService, private aP: AdminPanelService, private modals: MdbModalService) {
  }

  public async downloadBackup(id: number) {
    this.formDisabled = true;
    await this.app.api.callServer("get", "/auth/dbs", {
      action: "download",
      id: id
    }, {allowFileDownload: true}).then((success: ApiSuccess) => {

    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });
    this.formDisabled = false;
  }

  public deleteBackup(id: number) {
    this.backupFormSuccess = false;
    this.backupDeleted = false;
    this.compiledFormData = {
      action: "delete",
      id: id
    };

    this.modals.open(TotpModalComponent, {
      data: {
        body: `<span class="text-danger">TOTP is required to delete a <strong>Database Backup</strong>.</span>`,
        totpModalControl: this.totpModalControl,
        totpCodeAccept: this.totpCodeReceived
      }
    });
  }

  public submitBackupForm() {
    if (!this.backupsPrivilege) {
      return;
    }

    this.backupFormSuccess = false;
    this.backupDeleted = false;
    let inputErrors: number = 0;
    let formData: PlainObject = {
      action: "queue",
      database: ""
    };

    try {
      formData.database = this.dbBackupForm.controls.database.value;
      if (!formData.database || !formData.database.length) {
        throw new Error('Database selection is required');
      }
    } catch (e) {
      this.dbBackupForm.controls.database.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    this.compiledFormData = formData;
    this.modals.open(TotpModalComponent, {
      data: {
        body: `<span class="text-danger">TOTP is required to queue <strong>Database Backup</strong> job.</span>`,
        totpModalControl: this.totpModalControl,
        totpCodeAccept: this.totpCodeReceived
      }
    });
  }

  public sizeBytesToMb(bytes: number): number {
    return Math.round((((bytes / 1024) / 1024) + Number.EPSILON) * 100) / 100;
  }

  public loadedDbBackups(): boolean {
    return typeof this.dbBackups !== "undefined";
  }

  private async loadBackups() {
    this.dbBackups = undefined;
    await this.app.api.callServer("get", "/auth/dbs", {action: "backups"}).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("backups") && Array.isArray(success.result.backups)) {
        this.dbBackups = success.result.backups;
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });
  }

  private async loadDbConfig() {
    await this.app.api.callServer("get", "/auth/dbs", {action: "config"}).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("config") && typeof success.result.config === "object") {
        this.dbConfig = <DbConfig>success.result.config;
        this.mySqlDbs = [];
        Object.keys(this.dbConfig).forEach((key: string) => {
          if (this.dbConfig) {
            this.dbConfig[key].label = key;
            this.mySqlDbs?.push(this.dbConfig[key]);
          }
        });
      }

      if (success.result.hasOwnProperty("backupQueueBusy") && typeof success.result.backupQueueBusy === "boolean") {
        this.backupQueueBusy = success.result.backupQueueBusy;
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });
  }

  private async totpAPICall() {
    if (!this.compiledFormData) {
      return;
    }

    if (!this.compiledFormData.hasOwnProperty("totp") || typeof this.compiledFormData.totp !== "string" || this.compiledFormData.totp.length !== 6) {
      return;
    }

    let formGroup: undefined | FormGroup = undefined;
    if (this.compiledFormData.action === "queue") {
      formGroup = this.dbBackupForm;
    }

    this.formSubmit = true;
    this.formDisabled = true;
    this.totpModalControl.next({disabled: true, loading: true});
    await this.app.api.callServer("post", "/auth/dbs", this.compiledFormData).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("status") && success.result.status === true) {
        if (this.compiledFormData && this.compiledFormData.hasOwnProperty("action")) {
          if (this.compiledFormData.action === "queue") {
            this.backupFormSuccess = true;
            this.backupQueueBusy = true;
          }

          if (this.compiledFormData.action === "delete") {
            this.backupDeleted = true;
            let backupId: number = this.compiledFormData.id;
            this.dbBackups?.forEach((backup: DbBackup, index: number) => {
              if (backup.id === backupId) {
                this.dbBackups?.splice(index, 1);
              }
            });
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
    this.formDisabled = false;
    this.totpModalControl.next({disabled: false, loading: false});
  }

  ngOnInit(): void {
    // Events
    this.totpCodeReceived.subscribe((totpCode: string | null) => {
      if (typeof this.compiledFormData !== "object") {
        return;
      }

      this.compiledFormData.totp = totpCode;
      this.totpAPICall().then();
    });

    this.loadDbConfig().then();
    this.loadBackups().then();

    this.backupsPrivilege = false;
    if (this.app.auth.session().admin.isRoot) {
      this.backupsPrivilege = true;
    } else {
      let privileges = this.app.auth.session().admin.privileges;
      if (privileges.hasOwnProperty("downloadDbBackups") && privileges.downloadDbBackups) {
        this.backupsPrivilege = true;
      }
    }

    this.aP.breadcrumbs.next([
      {page: 'Application', active: true},
      {page: 'Databases', active: true, icon: "fal fa-database"}
    ]);
    this.aP.titleChange.next(["Databases", "Application"]);
  }

}
