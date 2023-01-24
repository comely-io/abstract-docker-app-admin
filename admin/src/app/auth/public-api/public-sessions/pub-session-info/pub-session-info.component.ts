import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {publicSession} from "../public-sessions.component";
import {MdbModalRef} from "mdb-angular-ui-kit/modal";
import {AppService} from "../../../../../services/appService";
import {ApiQueryFail, ApiSuccess} from "../../../../../services/apiService";

@Component({
  selector: 'app-pub-session-info',
  templateUrl: './pub-session-info.component.html',
  styleUrls: ['./pub-session-info.component.scss']
})
export class PubSessionInfoComponent implements OnInit, OnDestroy {
  @Input() session!: publicSession;

  public queriesCountLoading: boolean = false;
  public queriesCount?: number;

  constructor(private app: AppService, public modal: MdbModalRef<PubSessionInfoComponent>) {
  }

  public searchFingerprint() {
    this.modal.close({searchFp: this.session.fingerprint});
  }

  public async getQueriesCount() {
    this.queriesCountLoading = true;
    await this.app.api.callServer("get", "/auth/public_api/queries", {
      action: "count",
      sessionId: this.session.id
    }).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("count") && typeof success.result.count === "number") {
        this.queriesCount = success.result.count;
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });

    this.queriesCountLoading = false;
  }

  ngOnInit(): void {
    this.getQueriesCount().then();
  }

  ngOnDestroy() {
  }
}
