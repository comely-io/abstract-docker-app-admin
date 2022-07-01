import {Component, OnDestroy, OnInit} from '@angular/core';
import {AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {MdbModalRef, MdbModalService} from "mdb-angular-ui-kit/modal";
import {CreateGroupComponent} from "./create-group/create-group.component";
import {EditGroupComponent} from "./edit-group/edit-group.component";
import {DeleteGroupComponent} from "./delete-group/delete-group.component";

export interface userGroup {
  id: number,
  name: string,
  userCount: number,
  updatedOn: number
}

@Component({
  selector: 'app-user-groups',
  templateUrl: './user-groups.component.html',
  styleUrls: ['./user-groups.component.scss']
})
export class UserGroupsComponent implements OnInit, OnDestroy {
  public groupsFetching: boolean = false;
  public usersGroups: Array<userGroup> = [];

  public createGroupModal?: MdbModalRef<CreateGroupComponent> = undefined;
  public editGroupModal?: MdbModalRef<EditGroupComponent> = undefined;
  public deleteGroupModal?: MdbModalRef<EditGroupComponent> = undefined;

  constructor(private app: AppService, private aP: AdminPanelService, private modals: MdbModalService) {
  }

  public openCreateModal(): void {
    this.createGroupModal = this.modals.open(CreateGroupComponent);
  }

  public openEditModal(groupId: number): void {
    let group = this.getGroupObject(groupId);
    if (!group) {
      return;
    }

    this.editGroupModal = this.modals.open(EditGroupComponent, {data: {group: group, groupsList: this.usersGroups}});
  }

  public openDeleteModal(groupId: number): void {
    let group = this.getGroupObject(groupId);
    if (!group) {
      return;
    }

    this.deleteGroupModal = this.modals.open(DeleteGroupComponent, {
      data: {
        group: group,
        groupsList: this.usersGroups
      }
    });
  }

  private getGroupObject(id: number): userGroup | undefined {
    let breakException = {};
    let found: userGroup | undefined = undefined;

    try {
      this.usersGroups.forEach((group: userGroup) => {
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

  public async fetchGroups() {
    this.groupsFetching = true;
    this.usersGroups = [];

    await this.app.api.callServer("get", "/auth/users/groups", {}).then((success: ApiSuccess) => {
      this.usersGroups = success.result.groups;
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });

    this.groupsFetching = false;
  }

  ngOnInit(): void {
    this.fetchGroups().then();

    this.app.events.usersGroupReload().subscribe(() => {
      this.fetchGroups().then();
    })

    this.aP.breadcrumbs.next([
      {page: 'Users Control', icon: 'fal fa-users', active: true},
      {page: 'Groups', active: true}
    ]);
    this.aP.titleChange.next(["User Groups", "Users"]);
  }

  ngOnDestroy() {
    this.app.events.clearUsersGroupReload();
  }
}
