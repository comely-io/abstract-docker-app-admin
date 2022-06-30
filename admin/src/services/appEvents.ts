import {BehaviorSubject} from "rxjs";
import {ApiWarningMsg} from "./apiService";

export class AppEvents {
  private _signinChange: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private _apiCallWarnings: BehaviorSubject<Array<ApiWarningMsg>> = new BehaviorSubject<Array<ApiWarningMsg>>([]);
  private _userGroupsReload?: BehaviorSubject<null>;

  constructor() {
  }

  public apiCallWarnings(): BehaviorSubject<Array<ApiWarningMsg>> {
    return this._apiCallWarnings;
  }

  public onSigninChange(): BehaviorSubject<boolean> {
    return this._signinChange;
  }

  public usersGroupReload(): BehaviorSubject<null> {
    if (!this._userGroupsReload) {
      this._userGroupsReload = new BehaviorSubject<null>(null);
    }

    return this._userGroupsReload;
  }

  public clearUsersGroupReload(): void {
    this._userGroupsReload = undefined;
  }
}
