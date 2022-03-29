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
          {path: '', redirectTo: 'docker', pathMatch: 'full'},
          {path: 'docker', component: DockerComponent}
        ]
      },
      {
        path: 'staff',
        component: StaffComponent,
        children: [
          {path: '', redirectTo: 'log', pathMatch: 'full'},
          {path: 'log', component: LogComponent}
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
