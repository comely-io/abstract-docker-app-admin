import {Component, OnInit} from '@angular/core';
import {AppService} from "../../../../services/appService";
import {ValidatorService} from "../../../../services/validatorService";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {userGroup} from "../user-groups/user-groups.component";
import {AdminPanelService} from "../../../../services/adminPanelService";

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.scss']
})
export class CreateUserComponent implements OnInit {
  public usersGroups: Array<userGroup> = [];
  public validator: ValidatorService;

  public formIsLoading: boolean = false;
  public formIsDisabled: boolean = true;
  public createUserForm: FormGroup = new FormGroup({
    group: new FormControl("0"),
    username: new FormControl(),
    email: new FormControl(),
    phone: new FormControl(),
    totp: new FormControl()
  });

  constructor(private app: AppService, private aP: AdminPanelService) {
    this.validator = app.validator;
  }

  public async fetchGroups() {
    this.usersGroups = [];
    this.formIsDisabled = true;

    await this.app.api.callServer("get", "/auth/users/groups", {}).then((success: ApiSuccess) => {
      this.usersGroups = success.result.groups;
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });

    this.formIsDisabled = false;
  }

  public async submitCreateForm() {

  }

  public totpSubmit(e: any): void {
    this.validator.parseTotpField(e, () => {
      this.submitCreateForm().then();
    });
  }

  ngOnInit(): void {
    this.fetchGroups().then();

    this.aP.breadcrumbs.next([
      {page: 'Users Control', icon: 'fal fa-users', active: true},
      {page: 'Create User', active: true}
    ]);
    this.aP.titleChange.next(["Create User Account", "Users"]);
  }
}
