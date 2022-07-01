import {Component, Input, OnInit} from '@angular/core';
import {ValidatorService} from "../../../../../services/validatorService";
import {FormControl, FormGroup} from "@angular/forms";
import {ApiErrorHandleOpts, AppService} from "../../../../../services/appService";
import {MdbModalRef} from "mdb-angular-ui-kit/modal";
import {userGroup} from "../user-groups.component";
import {group} from "@angular/animations";
import {ApiQueryFail, ApiSuccess} from "../../../../../services/apiService";

@Component({
  selector: 'app-edit-group',
  templateUrl: './edit-group.component.html',
  styleUrls: ['./edit-group.component.scss']
})
export class EditGroupComponent implements OnInit {
  @Input() group!: userGroup;
  @Input() groupsList!: Array<userGroup>;

  public selectedGroupId: number = 0;
  public formIsLoading: boolean = false;
  public validator: ValidatorService;

  public editGroupForm: FormGroup = new FormGroup({
    group: new FormControl(),
    name: new FormControl(),
    totp: new FormControl()
  });

  constructor(public app: AppService, public modalRef: MdbModalRef<EditGroupComponent>) {
    this.validator = app.validator;
  }

  public async submitEditGroupForm() {
    let inputErrors: number = 0;
    let groupId: number = 0,
      name: string = "",
      totp: string = "";

    // Group ID
    try {
      groupId = parseInt(this.editGroupForm.get("group")?.value);
      if (!(groupId > 0 && groupId < Number.MAX_SAFE_INTEGER)) {
        throw new Error('Invalid selected users group to edit');
      }
    } catch (e) {
      this.editGroupForm.get("group")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Name
    try {
      name = this.editGroupForm.get("name")?.value;
      if (!name || !name.length) {
        throw new Error('Group label is required');
      }

      if (!/^[a-z\-_.]+(\s[a-z\-_.]+)*$/i.test(name)) {
        throw new Error('Invalid group name');
      }

      if (name.length < 3 || name.length > 32) {
        throw new Error('Group name cannot exceed 32 bytes in length');
      }
    } catch (e) {
      this.editGroupForm.get("name")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Totp
    try {
      totp = this.app.validator.validateTotp(this.editGroupForm.get("totp")?.value);
    } catch (e) {
      this.editGroupForm.get("totp")?.setErrors({message: e.message});
      inputErrors++;
    }

    // Errors?
    if (inputErrors !== 0) {
      return;
    }

    // Clear out TOTP code
    this.editGroupForm.get("totp")?.setValue("");

    this.formIsLoading = true;
    await this.app.api.callServer("post", "/auth/users/groups", {
      group: groupId,
      name: name,
      totp: totp
    }).then((success: ApiSuccess) => {
      if (success.result.hasOwnProperty("status") && success.result.status === true) {
        this.app.events.usersGroupReload().next(null);
        this.modalRef.close();
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error, <ApiErrorHandleOpts>{formGroup: this.editGroupForm});
    })
    this.formIsLoading = false;
  }

  public totpSubmit(e: any): void {
    this.validator.parseTotpField(e, () => {
      this.submitEditGroupForm().then();
    });
  }

  public changeEditGroup(e: any): void {
    let group = this.getGroupObject(e);
    if (!group) {
      this.modalRef.close();
      return;
    }

    this.selectedGroupId = e;
    this.group = <userGroup>group;
    this.editGroupForm.get("name")?.setValue(this.group.name);
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
    this.editGroupForm.get("name")?.setValue(this.group.name);
  }
}
