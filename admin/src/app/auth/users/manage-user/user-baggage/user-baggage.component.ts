import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {BehaviorSubject, Subscription} from "rxjs";
import {AppService} from "../../../../../services/appService";
import {userAccount} from "../manage-user.component";
import {ApiQueryFail, ApiSuccess} from "../../../../../services/apiService";
import {MdbModalRef, MdbModalService} from "mdb-angular-ui-kit/modal";
import {SetBaggageComponent} from "./set-baggage/set-baggage.component";
import {DeleteBaggageComponent} from "./delete-baggage/delete-baggage.component";

export interface userBaggageItem {
  user: number,
  key: string,
  data: string,
  length?: number,
}

@Component({
  selector: 'app-user-baggage',
  templateUrl: './user-baggage.component.html',
  styleUrls: ['./user-baggage.component.scss']
})
export class UserBaggageComponent implements OnInit, OnDestroy {
  @Input() user!: userAccount;
  @Input() baggageTabOpenEvent!: BehaviorSubject<boolean | null>;
  private watchers: Array<Subscription> = [];

  public setValueModal?: MdbModalRef<SetBaggageComponent>;
  public deleteValueModal?: MdbModalRef<DeleteBaggageComponent>;
  public baggageWasLoaded: boolean = false;
  public loadedBaggage?: Array<userBaggageItem>;

  constructor(private app: AppService, private modals: MdbModalService) {
  }

  private fetchItemFromLoaded(key: string): userBaggageItem | undefined {
    let breakException = {};
    let foundItem: userBaggageItem | undefined = undefined;

    try {
      this.loadedBaggage?.forEach((item: userBaggageItem) => {
        if (item.key === key) {
          foundItem = item;
          throw breakException;
        }
      });
    } catch (e) {
      if (e !== breakException) {
        throw e;
      }
    }

    return foundItem;
  }

  public showDeleteModal(key: string) {
    let foundItem = this.fetchItemFromLoaded(key);
    if (!foundItem) {
      return;
    }

    this.deleteValueModal = this.modals.open(DeleteBaggageComponent, {
      data: {
        userId: this.user.id,
        item: foundItem.key
      }
    });

    this.watchers.push(this.deleteValueModal?.onClose.subscribe((data: any) => {
      if (typeof data === "object") {
        if (data.hasOwnProperty("reloadBaggage") && data.reloadBaggage) {
          this.loadBaggage().then();
        }
      }
    }));
  }

  public openSetModal(key: string | undefined = undefined) {
    let modalData: any = {userId: this.user.id};
    if (key) {
      let foundItem = this.fetchItemFromLoaded(key);
      if (foundItem) {
        modalData["item"] = foundItem;
      }
    }

    this.setValueModal = this.modals.open(SetBaggageComponent, {data: modalData});
    this.watchers.push(this.setValueModal?.onClose.subscribe((data: any) => {
      if (typeof data === "object") {
        if (data.hasOwnProperty("reloadBaggage") && data.reloadBaggage) {
          this.loadBaggage().then();
        }
      }
    }));
  }

  public async loadBaggage() {
    this.loadedBaggage = undefined;
    await this.app.api.callServer("get", "/auth/users/baggage", {user: this.user.id}).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("items") && Array.isArray(success.result.items)) {
        this.loadedBaggage = success.result.items;
        this.baggageWasLoaded = true;
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });
  }

  ngOnInit(): void {
    this.watchers.push(this.baggageTabOpenEvent.subscribe((value: boolean | null) => {
      if (typeof value === "boolean") {
        this.loadBaggage().then();
      }
    }));
  }

  ngOnDestroy() {
    this.watchers.forEach((watcher: Subscription) => {
      watcher.unsubscribe();
    });
  }
}
