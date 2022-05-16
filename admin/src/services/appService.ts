import {Injectable} from "@angular/core";
import {Router} from "@angular/router";
import {HttpService} from "./httpService";
import {ValidatorService} from "./validatorService";
import {AppEvents} from "./appEvents";
import {notifyPos, NotifyService, notifyType} from "./notifyService";
import {AuthService} from "./authService";
import {ApiQueryFail, ApiService} from "./apiService";
import {FormGroup} from "@angular/forms";

export interface PlainObject {
  [key: string]: any
}

export interface AppFlashMessages {
  authSessionSignin?: string
}

export interface ApiErrorHandleOpts {
  showTitle: boolean,
  type: notifyType,
  position: notifyPos,
  preventAuthSession: boolean,
  formGroup?: FormGroup,
  callback?: (msg: string) => void
}

@Injectable({providedIn: "root"})

export class AppService {
  public readonly appName: string = "Administration Panel";
  public readonly persistent: boolean = true;
  public readonly localStorageMap = {
    authSessionId: "authSessionToken",
    authSessionHmacSecret: "authSessionHMACSecret"
  };

  public readonly flash: AppFlashMessages;
  public readonly api: ApiService;
  public readonly auth: AuthService;
  public readonly validator: ValidatorService;
  public readonly events: AppEvents;

  /**
   * AppService Constructor
   * @param http
   * @param router
   * @param notify
   */
  public constructor(
    public readonly http: HttpService,
    public readonly router: Router,
    public readonly notify: NotifyService
  ) {
    this.validator = new ValidatorService(this);
    this.events = new AppEvents(this);
    this.api = new ApiService(this);
    this.auth = new AuthService(this);
    this.flash = {};
  }

  public handleAPIError(error: ApiQueryFail, options?: ApiErrorHandleOpts): void {
    options = Object.assign(<ApiErrorHandleOpts>{
      showTitle: false,
      type: "error",
      position: "top-right",
      preventAuthSession: false
    }, options);

    let errorMsg: string = "An error occurred with API call";
    if (typeof error.exception === "object") {
      errorMsg = "An exception received from API server";
      if (typeof error.exception["message"] === "string" && error.exception.message.length) {
        errorMsg = error.exception.message;

        // Session related error?
        if (errorMsg.match(/^session_/i) && !options.preventAuthSession) {
          let sessionErrorCode = errorMsg.toLowerCase();
          let sessionErrorMessage = this.api.translateSessionError(sessionErrorCode);
          if (["session_token_req"].indexOf(sessionErrorCode) < 0) {
            // Clear any token/secret set in localStorage or memory
            this.auth.clear();

            // Set the flash message for signin controller
            this.flash.authSessionSignin = sessionErrorMessage;

            // Navigate to signin page
            this.router.navigate(["/signin"]).then();
            return;
          }
        }
      }

      if (options.formGroup && error.exception.hasOwnProperty("param")) {
        if (typeof error.exception.param === "string" && error.exception.param.length) {
          let formControl = options.formGroup.get(error.exception.param);
          if (formControl) {
            formControl.setErrors({message: errorMsg});
            return;
          }
        }
      }
    } else if (error.error?.length) {
      errorMsg = error.error;
    }

    // Has callback method? (for any alternative method of displaying error message)
    if (options.callback) {
      options.callback(errorMsg);
      return;
    }

    // Show the notification
    this.notify.toastr(
      options.type,
      options.position,
      errorMsg,
      options.showTitle ? `${error.meta.method.toUpperCase()} ${error.meta.endpoint}` : undefined
    );
  }

  /**
   * sprintf the PHP way!
   * @param str
   * @param data
   */
  public sprintf(str: string, data?: Array<any>): string {
    if (data && data.length > 0) {
      for (let i = 0; i < data.length; i++) {
        str = str.replace(/%d|%s/, data[i])
      }
    }

    return str;
  }

  /**
   * Copy text to clipboard
   * @param text
   * @param showNoty
   */
  public copyToClipboard(text: string, showNoty: boolean = true): void {
    let listener = (e: ClipboardEvent) => {
      if (e.clipboardData) {
        e.clipboardData.setData("text/plain", (text));
        e.preventDefault();
      }
    };

    document.addEventListener("copy", listener);
    document.execCommand("copy");
    document.removeEventListener("copy", listener);

    if (showNoty) {
      this.notify.info("Copied to clipboard!");
    }
  }
}
