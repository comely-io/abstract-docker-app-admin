import {Component, Input, OnInit} from '@angular/core';
import {AppService} from "../../../../../services/appService";
import {MdbModalRef} from "mdb-angular-ui-kit/modal";
import {DeleteGroupComponent} from "../../user-groups/delete-group/delete-group.component";
import {userAccount} from "../manage-user.component";

@Component({
  selector: 'app-delete-restore-user',
  templateUrl: './delete-restore-user.component.html',
  styleUrls: ['./delete-restore-user.component.scss']
})
export class DeleteRestoreUserComponent implements OnInit {
  @Input() user!: userAccount;

  constructor(public app: AppService, public modalRef: MdbModalRef<DeleteGroupComponent>) {
  }

  ngOnInit(): void {
  }

}
