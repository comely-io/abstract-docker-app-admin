import {AppService, PlainObject} from "./appService";
import {AppHttpRequest, AppHttpResponse, HttpMethod, HttpSimpleObject} from "./httpService";
import * as crypto from "crypto-js";
import {AuthSessionMeta} from "./authService";

export interface ApiConfig {
  server: string,
  authHeaderToken: string,
  authHeaderSignature: string
}

export type ApiPayloadData = PlainObject;
export const ApiDownloadFileTypes = ["json", "zip", "octet"] as const;

export interface ApiCallOptions {
  authSession?: boolean,
  useSessionToken?: AuthSessionMeta,
  timeOut?: number,
  hmacExcludeParams?: Array<string>,
  handleWarnings?: boolean,
  allowFileDownload?: boolean,
}

export interface ApiResponseMeta {
  method: string,
  endpoint: string,
  httpResponse?: AppHttpResponse
}

export interface ApiResponseBase {
  meta: ApiResponseMeta
  warnings?: Array<ApiWarningMsg>
}

export interface ApiSuccess extends ApiResponseBase {
  signalFileDownload?: boolean,
  result: PlainObject
}

export interface ApiQueryFail extends ApiResponseBase {
  error?: string,
  exception?: ApiException
}

export interface ApiException {
  message: string,
  param?: string,
  caught?: string,
  file?: string,
  line?: number,
  trace?: Array<any>
}

export interface ApiWarningMsg {
  meta: ApiResponseMeta,
  type: number,
  typeStr: string,
  message: string,
  file: string,
  line: number,
  triggered: boolean,
  timeStamp: number | string
}

export class ApiService {
  /*public readonly config: ApiConfig = {
    server: "https://test-admin.comely.io:2087",
    authHeaderToken: "admin-sess-token",
    authHeaderSignature: "admin-signature"
  };*/
  public readonly config: ApiConfig = {
    server: "https://knm-admin.tadas.pk",
    authHeaderToken: "admin-sess-token",
    authHeaderSignature: "admin-signature"
  };

  public constructor(private app: AppService) {
  }

  public translateSessionError(error: string): string {
    switch (error.toLowerCase()) {
      case "session_token_req":
        return "A valid session token is required for this endpoint";
      case "session_redundant":
        return "This session is no longer valid";
      case "session_retrieve_error":
      case "session_not_found":
        return "Authenticated session could not be retrieved";
      case "session_archived":
        return "Authenticated session was archived";
      case "session_ip_error":
        return "Your IP address has changed";
      case "session_timed_out":
        return "Authenticated session timed out";
      default:
        return error;
    }
  }

  /**
   * RFC3986 compatible URI encoding
   * @param params
   * @param prefix
   * @param excludeKeys
   */
  public queryEncode(params: any, prefix: string | undefined, excludeKeys: Array<string> | undefined = undefined): string {
    let apiService = this;
    let query: any = Object.keys(params).map((key: string) => {
      if (excludeKeys) {
        if (excludeKeys.indexOf(key.toLowerCase()) > -1) {
          return;
        }
      }

      let value = params[key];
      if (params.constructor === Array) {
        key = `${prefix}[]`;
      } else if (params.constructor === Object) {
        key = (prefix ? `${prefix}[${key}]` : key);
      }

      if (typeof value === "object") {
        return apiService.queryEncode(value, key);
      } else {
        return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
      }
    });

    return [].concat.apply([], query).join("&");
  }

  /**
   * Call API server
   * @param method
   * @param endpoint
   * @param data
   * @param options
   */
  public callServer(method: HttpMethod, endpoint: string, data: ApiPayloadData, options?: ApiCallOptions): Promise<ApiSuccess> {
    return new Promise<ApiSuccess>((success, fail) => {
      let httpService = this.app.http;
      let timeStamp = (new Date()).getTime();
      let apiCallMeta: ApiResponseMeta = {
        method: method,
        endpoint: endpoint,
      };

      // Headers
      let headers = <HttpSimpleObject>{};
      headers["Content-Type"] = "application/json";
      headers["Accept"] = "application/json";

      // API Call Options
      options = Object.assign(<ApiCallOptions>{
        authSession: true,
        preventDefault: false,
        handleWarnings: true,
      }, options);

      // Data
      data = Object.assign(data, {
        timeStamp: Math.floor(timeStamp / 1000)
      });

      // Authenticated Session Call?
      if (options.authSession) {
        let sessionMeta: AuthSessionMeta;
        if (options?.useSessionToken) {
          sessionMeta = options.useSessionToken;
        } else {
          try {
            sessionMeta = this.app.auth.meta();
          } catch (e) {
            return fail(<ApiQueryFail>{
              meta: apiCallMeta,
              error: e.message
            })
          }
        }

        let authHeader: Array<string> = [];
        authHeader.push(this.config.authHeaderToken + " " + sessionMeta.token);
        // HMAC user signature
        let hmacExcludeKeys: Array<string> = [];
        if (options.hmacExcludeParams) {
          options.hmacExcludeParams.forEach(function (param: string) {
            hmacExcludeKeys.push(param.toLowerCase());
          });
        }

        // RFC3986 compatible URI encoding
        let queryStr = this.queryEncode(data, undefined, hmacExcludeKeys);

        // Compute HMAC for payload as Signature
        let userSignature = crypto.HmacSHA512(queryStr, sessionMeta.hmacSecret).toString(crypto.enc.Hex);
        authHeader.push(this.config.authHeaderSignature + " " + userSignature);

        // Set "Authorization" headers
        headers["Authorization"] = authHeader.join(", ");
      }

      httpService.send(<AppHttpRequest>{
        method: method,
        headers: headers,
        payload: method === "get" ? data : JSON.stringify(data),
        url: this.config.server + endpoint,
        timeout: typeof options.timeOut === "number" ? options.timeOut * 10000 : undefined
      }).then((response: AppHttpResponse) => {
        let apiQueryFail: ApiQueryFail = {
          meta: apiCallMeta
        };

        // HTTP request was successful?
        if (!response.success || typeof response.body !== "string") {
          apiQueryFail.error = `API call to ${method.toUpperCase()} ${endpoint} failed with HTTP status code ${response.code}; Check network XHR logs`;
          return fail(apiQueryFail);
        }

        // Check Content-Deposition header
        let contentDisposition = response.headers.get("content-disposition");
        if (typeof contentDisposition === "string" && contentDisposition.match(/^attachment;/)) {
          try {
            if (options?.allowFileDownload !== true) {
              throw new Error(`File downloads are disabled for this query`);
            }

            let filename: string | undefined;
            let filenameMatch = /filename="?(.+)"?;?/.exec(contentDisposition);
            if (filenameMatch && filenameMatch.length > 1) {
              filename = filenameMatch[1];
            }

            if (!filename) {
              throw new Error(`File name is expected to be specified from the server side`);
            }

            let contentType = response.headers.get("content-type");
            let downloadType: string | undefined = undefined;
            if (typeof contentType !== "string") {
              throw new Error(`Cannot download file; Content-Type not received`);
            }

            ApiDownloadFileTypes.forEach((type: string) => {
              if (contentType?.match(new RegExp(`^application\/` + type))) {
                downloadType = type;
              }
            });

            if (!downloadType) {
              throw new Error(`Unsupported downloadable content type`);
            }

            let blob = new Blob(["\ufeff", response.body], {type: contentType + ";charset=UTF-8"});
            let download = document.createElement("a");
            download.setAttribute("href", window.URL.createObjectURL(blob));
            download.setAttribute("download", filename);
            download.click();
            return success(<ApiSuccess>{signalFileDownload: true});
          } catch (e) {
            apiQueryFail.error = e.message;
            return fail(apiQueryFail);
          }
        }

        // Check Content-Type header
        let contentType = response.headers.get("content-type");
        if (typeof contentType !== "string" || !contentType.match(/^application\/json/)) {
          let badContentType = typeof contentType === "string" ? contentType : typeof contentType;
          apiQueryFail.error = `Expected content type header value "application/json"; got ${badContentType}`;
          return fail(apiQueryFail);
        }

        // Decode JSON body
        let result: PlainObject;
        try {
          result = JSON.parse(response.body);
        } catch (e) {
          apiQueryFail.error = "Failed to decode JSON body; " + e.toString();
          return fail(apiQueryFail);
        }

        // Check if boolean "status" is present
        if (!result.hasOwnProperty("status") || typeof result.status !== "boolean") {
          apiQueryFail.error = 'Malformed response from server; Expected "status" as boolean';
          return fail(apiQueryFail);
        }

        // Look for server side warnings
        let apiWarnings: Array<ApiWarningMsg> = [];
        if (result.hasOwnProperty("warnings") && Array.isArray(result.warnings)) {
          let metaForWarnings: ApiResponseMeta = {
            method: method,
            endpoint: endpoint
          };
          result.warnings.forEach(function (warning) {
            warning = Object.assign({meta: metaForWarnings}, warning);
            apiWarnings.push(<ApiWarningMsg>warning);
          });

          delete result.warnings;
        }

        if (apiWarnings.length && options?.handleWarnings) {
          this.app.events.apiCallWarnings().next(apiWarnings);
        }

        // Look for server side exception
        if (!result.status) {
          if (result.hasOwnProperty("exception") && typeof result.exception === "object") {
            apiQueryFail.warnings = apiWarnings; // Append warnings to apiQueryFail object
            apiQueryFail.exception = <ApiException>result.exception;
            return fail(apiQueryFail);
          }
        }

        // Successful response
        let apiSuccess: ApiSuccess = {
          meta: apiCallMeta,
          warnings: apiWarnings,
          result: result
        };

        return success(apiSuccess);
      });
    });
  }
}
