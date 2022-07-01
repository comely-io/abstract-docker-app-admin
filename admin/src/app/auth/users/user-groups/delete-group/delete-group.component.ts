import {Component, Input, OnInit} from '@angular/core';
import {userGroup} from "../user-groups.component";
import {ValidatorService} from "../../../../../services/validatorService";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiErrorHandleOpts, AppService} from "../../../../../services/appService";
import {MdbModalRef} from "mdb-angular-ui-kit/modal";
import {ApiQueryFail, ApiSuccess} from "../../../../../services/apiService";

@Component({
  selector: 'app-delete-group',
  templateUrl: './delete-group.component.html',
  styleUrls: ['./delete-group.component.scss']
})
export class DeleteGroupComponent implements OnInit {
  @Input() group!: userGroup;
  @Input() groupsList!: Array<userGroup>;

  public selectedGroupId: number = 0;
  public formIsLoading: boolean = false;
  public validator: ValidatorService;

  public deleteGroupForm: FormGroup = new FormGroup({
    group: new FormControl(),
    totp: new FormControl()
  });

  constructor(public app: AppService, public modalRef: MdbModalRef<DeleteGroupComponent>) {
    this.validator = app.validator;
  }

  public async submitDeleteGroupForm() {
    let inputErrors: number = 0;
    let groupId: number = 0,
      totp: string = "";

    // Group ID
    try {
      groupId = parseInt(this.deleteGroupForm.get("group")?.value);
      if (!(groupId > 0 && groupId < Number.MAX_SAFE_INTEGER)) {
        throw new Error('Invalid selected users group to edit');
      }
    } catch (e) {
      this.deleteGroupForm.get("group")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Totp
    try {
      totp = this.app.validator.validateTotp(this.deleteGroupForm.get("totp")?.value);
    } catch (e) {
      this.deleteGroupForm.get("totp")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    // Clear out TOTP code
    this.deleteGroupForm.get("totp")?.setValue("");

    this.formIsLoading = true;
    await this.app.api.callServer("delete", "/auth/users/groups", {
      group: groupId,
      totp: totp
    }).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("status") && success.result.status === true) {
        this.app.events.usersGroupReload().next(null);
        this.modalRef.close();
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.deleteGroupForm});
    })
    this.formIsLoading = false;
  }

  public totpSubmit(e: any): void {
    this.validator.parseTotpField(e, () => {
      this.submitDeleteGroupForm().then();
    });
  }

  public changeSelectedGroup(e: any): void {
    let group = this.getGroupObject(e);
    if (!group) {
      this.modalRef.close();
      return;
    }

    this.selectedGroupId = e;
    this.group = <userGroup>group;
  }

  private getGroupObject(id: number): userGroup | undefined {
    let breakException = {};
    let found: userGroup | undefined = undefined;

    try {
      this.groupsList.forEach((group: userGroup) => {
        if (group.id === id) {
          found = group;
          throw breakException;
        }
      });
    } catch (e) {
      if (e !== breakException) {
        throw e;
      }
    }

    return found;
  }

  ngOnInit(): void {
    this.selectedGroupId = this.group.id;
  }
}
