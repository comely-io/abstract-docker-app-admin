import {Component, OnInit} from '@angular/core';
import {AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {MdbModalService} from "mdb-angular-ui-kit/modal";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {TotpModalComponent, totpModalControl} from "../../../shared/totp-modal/totp-modal.component";
import {BehaviorSubject} from "rxjs";

type cacheStatus = "checking" | "disabled" | "connected" | "failed";
type totpQueryCmd = "flush" | "delete";

interface totpQuery {
  command: totpQueryCmd,
  objectId?: string
}

interface cacheConfig {
  engine: string,
  host: string,
  port: number
}

interface cachedItem {
  id: string,
  label: string,
  found?: boolean,
  error?: string,
  cachedOn: number,
}

@Component({
  selector: 'app-caching',
  templateUrl: './caching.component.html',
  styleUrls: ['./caching.component.scss']
})
export class CachingComponent implements OnInit {
  public formDisabled: boolean = true;
  public cacheConfig?: cacheConfig;
  public cacheStatus: cacheStatus = "checking";
  public cacheServerError?: string;
  public cachedItems: Array<cachedItem> = [];
  public checkingCacheItems: boolean = false;

  private totpQueryCmd?: totpQuery;
  private totpModalControl: BehaviorSubject<totpModalControl> = new BehaviorSubject<totpModalControl>({});
  private totpCodeReceived: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

  constructor(private app: AppService, private aP: AdminPanelService, private modals: MdbModalService) {
    this.cachedItems.push({id: "app.systemConfig", label: "System Configuration", cachedOn: 0});
    this.cachedItems.push({id: "app.programConfig", label: "Program Configuration", cachedOn: 0});
    this.cachedItems.push({id: "app.mailConfig", label: "Mail Configuration", cachedOn: 0});
    this.cachedItems.push({id: "app.publicAPIAccess", label: "Public API Access", cachedOn: 0});
  }

  public flushAllModal(): void {
    this.totpQueryCmd = {command: "flush"};
    this.modals.open(TotpModalComponent, {
      data: {
        body: `<span class="text-warning">TOTP is required to <strong>Flush Cache</strong>.</span>`,
        totpModalControl: this.totpModalControl,
        totpCodeAccept: this.totpCodeReceived
      }
    });
  }

  public deleteObjectModal(objectId: string, label: string): void {
    if (!/^[a-z\d\-._+]{2,40}$/i.test(objectId)) {
      this.app.notify.warning('Invalid object ID');
      return;
    }

    this.totpQueryCmd = <totpQuery>{command: "delete", objectId: objectId};
    this.modals.open(TotpModalComponent, {
      data: {
        body: `<span class="text-info">TOTP is required to delete "<strong>${label}</strong>".</span>`,
        totpModalControl: this.totpModalControl,
        totpCodeAccept: this.totpCodeReceived
      }
    });
  }

  public async checkCacheItems() {
    if (this.checkingCacheItems) {
      return;
    }

    this.formDisabled = true;
    this.checkingCacheItems = true;
    let objectIds: Array<string> = [];
    this.cachedItems.forEach((item: cachedItem) => {
      objectIds.push(item.id);
    });

    await this.app.api.callServer("get", "/auth/caching", {
      action: "objects",
      objects: objectIds.join(",")
    }).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("objects") && typeof success.result.objects === "object") {
        this.updateCachedItemStatus(success.result.objects);
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
      this.cachedItems.forEach((item: cachedItem, index: number) => {
        this.cachedItems[index].error = "HTTP Query Fail";
      })
    });

    this.checkingCacheItems = false;
    this.formDisabled = false;
  }

  private updateCachedItemStatus(results: any) {
    let FoundItemIndexExc = {};
    Object.keys(results).forEach((key: string) => {
      let foundIndex = -1;
      try {
        this.cachedItems.forEach((item: cachedItem, index: number) => {
          if (item.id === key) {
            foundIndex = index;
            throw FoundItemIndexExc;
          }
        });
      } catch (e) {
      }

      if (foundIndex >= 0) {
        this.cachedItems[foundIndex].error = undefined;
        this.cachedItems[foundIndex].cachedOn = 0;
        this.cachedItems[foundIndex].found = undefined;

        if (results[key].hasOwnProperty("found") && typeof results[key].found === "boolean") {
          this.cachedItems[foundIndex].found = results[key].found;
          this.cachedItems[foundIndex].cachedOn = results[key].cachedOn;
        }

        if (results[key].hasOwnProperty("error") && typeof results[key].error === "string") {
          this.cachedItems[foundIndex].error = results[key].error;
        }
      }
    });
  }

  private async loadAndPing() {
    this.formDisabled = true;
    this.cacheStatus = "checking";
    this.cacheConfig = undefined;
    this.cacheServerError = undefined;

    await this.loadCacheSetup().then((cacheConfig: cacheConfig) => {
      this.cacheConfig = cacheConfig;
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    })

    await this.pingCacheServer().then((status: cacheStatus) => {
      this.cacheStatus = status;
      if (this.cacheStatus === "connected") {
        this.formDisabled = false;
        this.checkCacheItems();
      }
    }).catch((error: ApiQueryFail) => {
      this.cacheStatus = "failed";
      this.cacheServerError = error.exception?.message ?? error.error ?? 'Failed to connect with caching server';
    });
  }

  private pingCacheServer(): Promise<cacheStatus> {
    return new Promise<cacheStatus>((serverStatus, fail) => {
      if (!this.cacheConfig?.engine) {
        serverStatus("disabled");
        return;
      }

      this.app.api.callServer("get", "/auth/caching", {action: "status"}).then((success: ApiSuccess) => {
        if (success.result.hasOwnProperty("isConnected") && success.result.isConnected === true) {
          serverStatus("connected");
          return;
        }

        serverStatus("failed");
        return;
      }).catch((error: ApiQueryFail) => {
        fail(error);
        return;
      })
    });
  }

  private loadCacheSetup(): Promise<cacheConfig> {
    return new Promise<cacheConfig>((gotSetup, fail) => {
      this.app.api.callServer("get", "/auth/caching", {action: "config"}).then((success: ApiSuccess) => {
        if (success.result.hasOwnProperty("config") && typeof success.result.config === "object") {
          gotSetup(<cacheConfig>success.result.config);
          return;
        }
      }).catch((error: ApiQueryFail) => {
        fail(error);
        return;
      });
    });
  }

  private async queryFlushAll(totpCode: string) {
    if (this.formDisabled) {
      return;
    }

    this.formDisabled = true;
    this.totpModalControl.next({disabled: true, loading: true});
    await this.app.api.callServer("post", "/auth/caching", {
      action: "flush",
      totp: totpCode
    }).then((success: ApiSuccess) => {
      this.totpModalControl.next({close: true});
      if (success.result.hasOwnProperty("status") && success.result.status === true) {
        this.app.notify.success('Cache server flushed');
        this.cachedItems.forEach((item: cachedItem, index: number) => {
          this.cachedItems[index].found = false;
          this.cachedItems[index].cachedOn = 0;
        });
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

  private async queryDeleteItem(totpCode: string, objectId: string | undefined) {
    if (!objectId) {
      return;
    }

    if (this.formDisabled) {
      return;
    }

    this.formDisabled = true;
    this.totpModalControl.next({disabled: true, loading: true});
    await this.app.api.callServer("post", "/auth/caching", {
      action: "delete",
      object: objectId,
      totp: totpCode
    }).then((success: ApiSuccess) => {
      this.totpModalControl.next({close: true});
      if (success.result.hasOwnProperty("status") && success.result.status === true) {
        this.cachedItems.forEach((item: cachedItem, index: number) => {
          if (item.id === objectId) {
            this.cachedItems[index].found = false;
            this.cachedItems[index].cachedOn = 0
          }
        });
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

  ngOnInit(): void {
    this.totpCodeReceived.subscribe((totpCode: string | null) => {
      if (typeof totpCode !== "string" || totpCode.length !== 6) {
        return;
      }

      if (!this.totpQueryCmd) {
        return;
      }

      switch (this.totpQueryCmd.command) {
        case "flush":
          this.queryFlushAll(totpCode).then();
          return;
        case "delete":
          this.queryDeleteItem(totpCode, this.totpQueryCmd.objectId).then();
          return;
      }
    });

    this.loadAndPing().then();

    this.aP.breadcrumbs.next([
      {page: 'Application', active: true},
      {page: 'Caching Engine', active: true}
    ]);
    this.aP.titleChange.next(["Caching Engine", "Application"]);
  }
}
