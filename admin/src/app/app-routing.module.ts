import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {SigninComponent} from "./signin/signin.component";
import {AuthComponent} from "./auth/auth.component";
import {DashboardComponent} from "./auth/dashboard/dashboard.component";
import {AuthGuard} from "../services/authGuard";
import {AuthAppComponent} from "./auth/app/app.component";
import {DockerComponent} from "./auth/app/docker/docker.component";
import {AccountComponent} from "./auth/account/account.component";
import {LogComponent} from "./auth/staff/log/log.component";
import {StaffComponent} from "./auth/staff/staff.component";
import {ListComponent} from "./auth/staff/list/list.component";
import {InsertAdminComponent} from "./auth/staff/insert-admin/insert-admin.component";
import {EditAdminComponent} from "./auth/staff/edit-admin/edit-admin.component";
import {AdminSessionsComponent} from "./auth/staff/admin-sessions/admin-sessions.component";
import {UsersComponent} from "./auth/users/users.component";
import {SearchUsersComponent} from "./auth/users/search-users/search-users.component";
import {UserGroupsComponent} from "./auth/users/user-groups/user-groups.component";
import {CreateUserComponent} from "./auth/users/create-user/create-user.component";
import {ManageUserComponent} from "./auth/users/manage-user/manage-user.component";
import {CountriesComponent} from "./auth/app/countries/countries.component";
import {MailsComponent} from "./auth/mails/mails.component";
import {MailsConfigComponent} from "./auth/mails/mails-config/mails-config.component";
import {PublicApiComponent} from "./auth/public-api/public-api.component";
import {AccessConfigComponent} from "./auth/public-api/access-config/access-config.component";
import {CachingComponent} from "./auth/app/caching/caching.component";
import {ProgramConfigComponent} from "./auth/app/program-config/program-config.component";
import {DbBackupsComponent} from "./auth/app/db-backups/db-backups.component";
import {PublicSessionsComponent} from "./auth/public-api/public-sessions/public-sessions.component";
import {PublicQueriesComponent} from "./auth/public-api/public-queries/public-queries.component";

const routes: Routes = [
  {path: '', component: SigninComponent},
  {path: 'signin', component: SigninComponent},
  {
    path: 'auth',
    component: AuthComponent,
    canActivate: [AuthGuard],
    children: [
      {path: '', redirectTo: 'dashboard', pathMatch: 'full'},
      {path: 'dashboard', component: DashboardComponent},
      {path: 'account', component: AccountComponent},
      {
        path: 'app',
        component: AuthAppComponent,
        children: [
          {path: '', redirectTo: 'config', pathMatch: 'full'},
          {path: 'config', component: ProgramConfigComponent},
          {path: 'docker', component: DockerComponent},
          {path: 'countries', component: CountriesComponent},
          {path: 'caching', component: CachingComponent},
          {path: 'dbs', component: DbBackupsComponent}
        ]
      },
      {
        path: 'users',
        component: UsersComponent,
        children: [
          {path: '', redirectTo: 'search', pathMatch: 'full'},
          {path: 'search', component: SearchUsersComponent},
          {path: 'manage', component: ManageUserComponent},
          {path: 'groups', component: UserGroupsComponent},
          {path: 'create', component: CreateUserComponent}
        ]
      },
      {
        path: 'mails',
        component: MailsComponent,
        children: [
          {path: '', redirectTo: 'config', pathMatch: 'full'},
          {path: 'config', component: MailsConfigComponent},
        ]
      },
      {
        path: 'public-api',
        component: PublicApiComponent,
        children: [
          {path: '', redirectTo: 'config', pathMatch: 'full'},
          {path: 'config', component: AccessConfigComponent},
          {path: 'sessions', component: PublicSessionsComponent},
          {path: 'queries', component: PublicQueriesComponent},
        ]
      },
      {
        path: 'staff',
        component: StaffComponent,
        children: [
          {path: '', redirectTo: 'list', pathMatch: 'full'},
          {path: 'list', component: ListComponent},
          {path: 'insert', component: InsertAdminComponent},
          {path: 'edit', component: EditAdminComponent},
          {path: 'log', component: LogComponent},
          {path: 'sessions', component: AdminSessionsComponent}
        ]
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
