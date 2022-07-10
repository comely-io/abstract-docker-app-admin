import {Component, OnInit} from '@angular/core';
import {ApiErrorHandleOpts, AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {FormControl, FormGroup} from "@angular/forms";
import {userGroup} from "../user-groups/user-groups.component";
import {ActivatedRoute, Params} from "@angular/router";
import {countryList} from "../../countries/countries.component";
import {ValidatorService} from "../../../../services/validatorService";

export type userStatus = "active" | "disabled";

export interface userAccount {
  id: number,
  referrerId?: number | null,
  groupId: number,
  archived: number,
  status: userStatus,
  username: string,
  email?: string | null,
  emailVerified: number,
  phone?: string | null,
  phoneVerified: string,
  country?: string | null,
  createdOn: number,
  updatedOn: number,
  referrerUsername?: string | null,
  referralsCount?: number | null,
  checksumVerified?: boolean | null
}

export interface userProfileDob {
  d: number,
  m: number,
  Y: number
}

export interface userProfile {
  userId: number,
  idVerified: number,
  addressVerified: number,
  firstName?: string | null,
  lastName?: string | null,
  gender?: string | null,
  address1?: string | null,
  address2?: string | null,
  postalCode?: string | null,
  city?: string | null,
  state?: string | null,
  isRegistered?: boolean | null,
  checksumValidated?: boolean | null,
  dobTs?: number | null,
  dobDate?: userProfileDob | null
}

@Component({
  selector: 'app-manage-user',
  templateUrl: './manage-user.component.html',
  styleUrls: ['./manage-user.component.scss']
})
export class ManageUserComponent implements OnInit {
  private userId!: number;
  public user!: userAccount;
  public userProfile?: userProfile;
  public usersGroups: Array<userGroup> = [];
  public userAccountLoadErrors: Array<string> = [];
  public countriesList?: countryList;
  public validator: ValidatorService;

  public formsAreDisabled: boolean = true;

  public editAccountSuccess: boolean = false;
  public editAccountSubmit: boolean = false;
  public editAccountForm: FormGroup = new FormGroup({
    group: new FormControl("0"),
    status: new FormControl(),
    username: new FormControl(),
    email: new FormControl(),
    phone: new FormControl(),
    country: new FormControl(),
    totp: new FormControl(),
  });

  public editProfileSuccess: boolean = false;
  public editProfileSubmit: boolean = false;
  public editProfileForm: FormGroup = new FormGroup({
    firstName: new FormControl(),
    lastName: new FormControl(),
    gender: new FormControl("o"),
    dob: new FormControl(),
    address1: new FormControl(),
    address2: new FormControl(),
    postalCode: new FormControl(),
    city: new FormControl(),
    state: new FormControl(),
    totp: new FormControl()
  });

  public editReferrerSuccess: boolean = false;
  public editReferrerSubmit: boolean = false;
  public editReferrerForm: FormGroup = new FormGroup({
    referrer: new FormControl(),
    totp: new FormControl()
  });

  public resetActionSuccess?: string = "";
  public resetActionSubmit: boolean = false;
  public resetForm: FormGroup = new FormGroup({
    action: new FormControl(""),
    totp: new FormControl()
  });

  constructor(private app: AppService, private aP: AdminPanelService, private route: ActivatedRoute) {
    this.validator = app.validator;
    this.route.queryParams.subscribe((params: Params) => {
      this.userId = parseInt(params["id"]);
    });
  }

  /**
   * Reset account actions
   */
  public resetTotpType(e: any) {
    this.validator.parseTotpField(e, () => {
      this.submitResetForm().then();
    });
  }

  public async submitResetForm() {
    this.resetActionSuccess = undefined;
    let inputErrors: number = 0,
      action: string = "",
      totp: string = "";

    // Action
    try {
      action = this.resetForm.get("action")?.value;
      if (!action || ["checksum", "disable2fa", "re_credentials", "re_params"].indexOf(action) <= -1) {
        throw new Error('Invalid account reset action');
      }
    } catch (e) {
      this.resetForm.get("action")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Totp
    try {
      totp = this.app.validator.validateTotp(this.resetForm.get("totp")?.value);
    } catch (e) {
      this.resetForm.get("totp")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    // Clear out TOTP code
    this.resetForm.get("totp")?.setValue("");

    this.resetActionSubmit = true;
    this.formsAreDisabled = true;
    await this.app.api.callServer("post", "/auth/users/user", {
      user: this.user.id,
      action: action,
      totp: totp,
    }).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("success") && typeof success.result.success === "string" && success.result.success.length) {
        this.resetActionSuccess = success.result.success;
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.resetForm});
    });

    this.resetActionSubmit = false;
    this.formsAreDisabled = false;
  }

  /**
   * Edit profile
   */
  public editProfileTotpType(e: any) {
    this.validator.parseTotpField(e, () => {
      this.submitEditProfile().then();
    });
  }

  public async submitEditProfile() {

  }

  /**
   * Edit referrer
   * @param e
   */
  public editReferrerTotpType(e: any) {
    this.validator.parseTotpField(e, () => {
      this.submitEditReferrer().then();
    });
  }

  public async submitEditReferrer() {

  }

  /**
   * Submitting edit account form
   * @param e
   */
  public editAccountTotpType(e: any) {
    this.validator.parseTotpField(e, () => {
      this.submitEditAccount().then();
    });
  }

  public async submitEditAccount() {

  }

  /**
   * Load user's profile
   * @private
   */
  private async loadUserProfile() {
    this.app.api.callServer("get", "/auth/users/profiles", {user: this.user.id}).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("profile") && typeof success.result.profile === "object") {
        this.userProfile = <userProfile>success.result.profile;

        this.editProfileForm.controls.firstName.setValue(this.userProfile.firstName);
        this.editProfileForm.controls.lastName.setValue(this.userProfile.lastName);
        this.editProfileForm.controls.gender.setValue(this.userProfile.gender ?? "o");
        this.editProfileForm.controls.address1.setValue(this.userProfile.address1);
        this.editProfileForm.controls.address2.setValue(this.userProfile.address2);
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });
  }

  /**
   * Load countries list from cache
   * @private
   */
  private async loadCountriesList() {
    this.app.api.callServer("get", "/auth/countries", {
      action: "list",
      cache: true
    }).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("countries") && typeof success.result.countries === "object") {
        this.countriesList = <countryList>success.result.countries;

        if (this.user && typeof this.user.country === "string") {
          this.editAccountForm.controls.country.setValue(this.user.country);
        }
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });
  }

  /**
   * Load users groups & user account
   * @private
   */
  private async loadUserAccount() {
    if (!this.userId || this.userId <= 0) {
      this.app.router.navigate(["/auth/users/search"]).then();
      return;
    }

    await this.app.api.callServer("get", "/auth/users/groups", {}).then((success: ApiSuccess) => {
      this.usersGroups = success.result.groups;
    }).catch((error: ApiQueryFail) => {
      this.app.flash.userRetrieveFail = error.error ?? error.exception?.message ?? undefined;
    });

    if (!this.usersGroups.length) {
      this.app.router.navigate(["/auth/users/search"]).then();
      return;
    }

    await this.app.api.callServer("get", "/auth/users/user", {user: this.userId}).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("user") && typeof success.result.user === "object") {
        this.user = <userAccount>success.result.user;

        if (success.result.hasOwnProperty("errors") && typeof success.result.errors === "object") {
          this.userAccountLoadErrors = success.result.errors;
        }
      }
    }).catch((error: ApiQueryFail) => {
      this.app.flash.userRetrieveFail = error.error ?? error.exception?.message ?? undefined;
    });

    if (!this.user) {
      this.app.router.navigate(["/auth/users/search"]).then();
      return;
    }

    this.loadUserProfile().then();

    this.editAccountForm.controls.status.setValue(this.user.status);
    this.editAccountForm.controls.group.setValue(this.user.groupId);
    this.editAccountForm.controls.username.setValue(this.user.username);
    this.editAccountForm.controls.email.setValue(this.user.email);
    this.editAccountForm.controls.phone.setValue(this.user.phone);

    if (this.countriesList) {
      this.editAccountForm.controls.country.setValue(this.user.country ?? "");
    }

    if (this.user.referrerUsername) {
      this.editReferrerForm.controls.referrer.setValue(this.user.referrerUsername);
    }

    this.formsAreDisabled = false;
    this.aP.breadcrumbs.next([
      {page: 'Users Control', icon: 'fal fa-users', active: true},
      {page: 'Edit Account # ' + this.user.id, active: true}
    ]);

    this.aP.titleChange.next(["User Account # " + this.user.id, "Edit Account", "Users"]);
  }

  ngOnInit(): void {
    this.loadCountriesList().then();
    this.loadUserAccount().then();

    this.aP.breadcrumbs.next([
      {page: 'Users Control', icon: 'fal fa-users', active: true},
      {page: 'Edit Account', active: true}
    ]);

    this.aP.titleChange.next(["Edit Account", "Users"]);
  }
}
