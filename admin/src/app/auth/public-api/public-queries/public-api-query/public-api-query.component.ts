import {Component, OnDestroy, OnInit} from '@angular/core';
import {ApiErrorMsg, ApiQueryFail, ApiSuccess} from "../../../../../services/apiService";
import {publicQuery} from "../public-queries.component";
import {AppService} from "../../../../../services/appService";
import {AdminPanelService} from "../../../../../services/adminPanelService";
import {ActivatedRoute, Params} from "@angular/router";
import {Subscription} from "rxjs";
import {FormControl, FormGroup} from "@angular/forms";
import {MdbModalService} from "mdb-angular-ui-kit/modal";
import {PubSessionInfoComponent} from "../../public-sessions/pub-session-info/pub-session-info.component";
import {publicSession} from "../../public-sessions/public-sessions.component";

interface httpHeaders {
  [key: string]: string,
}

interface httpPayload {
  [key: string]: any
}

interface payloadDbQueries {
  db: string,
  query: payloadDbQuery
}

interface payloadDbQuery {
  sql: string,
  data: any,
  rows: number,
  error?: payloadDbQueryError
}

interface payloadDbQueryError {
  code?: string | number,
  info?: string,
  sqlState?: string,
}

export interface publicQueryPayload {
  query: number,
  reqHeaders: httpHeaders,
  resHeaders: httpHeaders,
  reqBody: httpPayload,
  resBody?: string,
  errors: Array<ApiErrorMsg>,
  dbQueries: Array<payloadDbQueries>,
}

interface publicQueryFull extends publicQuery {
  payload?: publicQueryPayload,
  payloadError?: string,
  timespan?: string
}

interface loadedQueryMeta {
  reqHeadersDisplayed: boolean,
  reqHeadersCount: number,
  reqBodyDisplayed: boolean,
  reqBodyCount: number,
  resHeadersDisplayed: boolean,
  resHeadersCount: number,
  resBodyDisplayed: boolean,
  resBodyLen?: number,
}

@Component({
  selector: 'app-public-api-query',
  templateUrl: './public-api-query.component.html',
  styleUrls: ['./public-api-query.component.scss']
})
export class PublicApiQueryComponent implements OnInit, OnDestroy {
  private urlQueryWatch?: Subscription;
  public searchLoading: boolean = false;
  public searchErrorMsg?: string;
  public searchForm: FormGroup = new FormGroup({
    rayId: new FormControl()
  });

  public query?: publicQueryFull;
  public loadedQueryMeta?: loadedQueryMeta;
  private loadingSession: boolean = false;

  constructor(private app: AppService, private aP: AdminPanelService, private route: ActivatedRoute, private modals: MdbModalService) {
  }

  public async loadSessionModal() {
    if (this.loadingSession) {
      return;
    }

    if (!this.query || !this.query.flagApiSess || !(this.query.flagApiSess > 0)) {
      return;
    }

    this.loadingSession = true;
    await this.app.api.callServer("get", "/auth/public_api/sessions", {sessionId: this.query.flagApiSess}).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("session") && typeof success.result.session === "object") {
        this.modals.open(PubSessionInfoComponent, {
          modalClass: "modal-lg modal-dialog-scrollable",
          data: {
            session: <publicSession>success.result.session,
            isSessionsPage: false,
            overrideUsername: this.query?.flagUsername,
          }
        });
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });

    this.loadingSession = false;
  }

  private displayQuery(query: publicQueryFull) {
    this.loadedQueryMeta = {
      reqHeadersDisplayed: false,
      reqHeadersCount: 0,
      reqBodyDisplayed: true,
      reqBodyCount: 0,
      resHeadersDisplayed: true,
      resBodyDisplayed: true,
      resHeadersCount: 0,
      resBodyLen: undefined,
    };

    if (query.payload) {
      if (query.payload.reqHeaders) {
        this.loadedQueryMeta.reqHeadersCount = Object.keys(query.payload.reqHeaders).length;
      }

      if (query.payload.reqBody) {
        this.loadedQueryMeta.reqBodyCount = Object.keys(query.payload.reqBody).length;
      }

      if (query.payload.resHeaders) {
        this.loadedQueryMeta.resHeadersCount = Object.keys(query.payload.resHeaders).length;
      }

      if (query.payload.resBody) {
        this.loadedQueryMeta.resBodyLen = query.payload.resBody.length;
      }
    }

    this.query = query;
  }

  public async fetchQuery() {
    this.searchErrorMsg = undefined;
    this.query = undefined;

    let queryId: string = "";
    try {
      queryId = this.searchForm.controls.rayId.value;
      if (!queryId) {
        throw new Error('API query ray # is required to trace/fetch');
      }

      if (!/^[a-f0-9]{1,64}$/.test(queryId)) {
        throw new Error('API query ray # contains an illegal character');
      }
    } catch (e) {
      this.searchErrorMsg = e.message;
      return;
    }

    this.searchLoading = true;
    await this.app.api.callServer("get", "/auth/public_api/queries", {
      action: "query",
      query: parseInt(queryId, 16)
    }).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("query") && typeof success.result.query === "object") {
        this.displayQuery(<publicQueryFull>success.result.query);
      }
    }).catch((error: ApiQueryFail) => {
      this.searchErrorMsg = error.exception?.message ?? error.error ?? 'Check browser XHR logs for error info';
    });

    this.searchLoading = false;
  }

  ngOnInit(): void {
    this.urlQueryWatch = this.route.queryParams.subscribe((params: Params) => {
      if (params.hasOwnProperty("ray")) {
        if (/^[a-f0-9]{1,64}$/.test(params.ray)) {
          this.searchForm.controls.rayId.setValue(params.ray);
        }
      }
    });

    setTimeout(() => {
      this.fetchQuery().then();
    }, 300);

    this.aP.breadcrumbs.next([
      {page: 'Public API', active: true, icon: 'fal fa-globe'},
      {page: 'API Queries', active: false, link: "/auth/public-api/queries"},
      {page: 'API Query Lookup'}
    ]);

    this.aP.titleChange.next(["Lookup", "API Queries", "Public API"]);
  }

  ngOnDestroy() {
    this.urlQueryWatch?.unsubscribe();
  }
}
