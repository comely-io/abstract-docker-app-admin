import {Component, Input, OnInit} from '@angular/core';
import {ValidatorService} from "../../../../../services/validatorService";
import {FormControl, FormGroup} from "@angular/forms";
import {AppService} from "../../../../../services/appService";
import {MdbModalRef} from "mdb-angular-ui-kit/modal";
import {userGroup} from "../user-groups.component";
import {group} from "@angular/animations";

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
