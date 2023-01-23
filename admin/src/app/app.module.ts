import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {MdbAccordionModule} from 'mdb-angular-ui-kit/accordion';
import {MdbAutocompleteModule} from 'mdb-angular-ui-kit/autocomplete';
import {MdbCarouselModule} from 'mdb-angular-ui-kit/carousel';
import {MdbChartModule} from 'mdb-angular-ui-kit/charts';
import {MdbCheckboxModule} from 'mdb-angular-ui-kit/checkbox';
import {MdbCollapseModule} from 'mdb-angular-ui-kit/collapse';
import {MdbDatepickerModule} from 'mdb-angular-ui-kit/datepicker';
import {MdbDropdownModule} from 'mdb-angular-ui-kit/dropdown';
import {MdbFormsModule} from 'mdb-angular-ui-kit/forms';
import {MdbInfiniteScrollModule} from 'mdb-angular-ui-kit/infinite-scroll';
import {MdbLazyLoadingModule} from 'mdb-angular-ui-kit/lazy-loading';
import {MdbLightboxModule} from 'mdb-angular-ui-kit/lightbox';
import {MdbLoadingModule} from 'mdb-angular-ui-kit/loading';
import {MdbModalModule} from 'mdb-angular-ui-kit/modal';
import {MdbNotificationModule} from 'mdb-angular-ui-kit/notification';
import {MdbPopconfirmModule} from 'mdb-angular-ui-kit/popconfirm';
import {MdbPopoverModule} from 'mdb-angular-ui-kit/popover';
import {MdbRadioModule} from 'mdb-angular-ui-kit/radio';
import {MdbRangeModule} from 'mdb-angular-ui-kit/range';
import {MdbRatingModule} from 'mdb-angular-ui-kit/rating';
import {MdbRippleModule} from 'mdb-angular-ui-kit/ripple';
import {MdbScrollbarModule} from 'mdb-angular-ui-kit/scrollbar';
import {MdbScrollspyModule} from 'mdb-angular-ui-kit/scrollspy';
import {MdbSelectModule} from 'mdb-angular-ui-kit/select';
import {MdbSidenavModule} from 'mdb-angular-ui-kit/sidenav';
import {MdbSmoothScrollModule} from 'mdb-angular-ui-kit/smooth-scroll';
import {MdbStepperModule} from 'mdb-angular-ui-kit/stepper';
import {MdbStickyModule} from 'mdb-angular-ui-kit/sticky';
import {MdbTableModule} from 'mdb-angular-ui-kit/table';
import {MdbTabsModule} from 'mdb-angular-ui-kit/tabs';
import {MdbTimepickerModule} from 'mdb-angular-ui-kit/timepicker';
import {MdbTooltipModule} from 'mdb-angular-ui-kit/tooltip';
import {MdbValidationModule} from 'mdb-angular-ui-kit/validation';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {SigninComponent} from './signin/signin.component';
import {FormFieldErrorComponent} from './shared/form-field-error/form-field-error.component';
import {ToastrModule} from 'ngx-toastr';
import {ReactiveFormsModule} from "@angular/forms";
import {AuthComponent} from './auth/auth.component';
import {DashboardComponent} from './auth/dashboard/dashboard.component';
import {ButtonLoaderComponent} from './shared/button-loader/button-loader.component';
import {DockerComponent} from './auth/app/docker/docker.component';
import {AuthAppComponent} from './auth/app/app.component';
import {SpinnerIconComponent} from './shared/spinner-icon/spinner-icon.component';
import {AccountComponent} from './auth/account/account.component';
import {LogComponent} from './auth/staff/log/log.component';
import {StaffComponent} from './auth/staff/staff.component';
import {PaginationComponent} from './shared/pagination/pagination.component';
import {ListComponent} from './auth/staff/list/list.component';
import {momentPipe, momentRelativePipe} from "../pipes/momentPipe";
import {time2StrPipe} from "../pipes/time2StrPipe";
import {TimestampDisplayComponent} from './shared/timestamp-display/timestamp-display.component';
import {InsertAdminComponent} from './auth/staff/insert-admin/insert-admin.component';
import {EditAdminComponent} from './auth/staff/edit-admin/edit-admin.component';
import {PermissionErrorComponent} from './shared/permission-error/permission-error.component';
import {AdminSessionsComponent} from './auth/staff/admin-sessions/admin-sessions.component';
import {UserGroupsComponent} from './auth/users/user-groups/user-groups.component';
import {UsersComponent} from './auth/users/users.component';
import {SearchUsersComponent} from './auth/users/search-users/search-users.component';
import {CreateGroupComponent} from './auth/users/user-groups/create-group/create-group.component';
import {EditGroupComponent} from './auth/users/user-groups/edit-group/edit-group.component';
import {DeleteGroupComponent} from './auth/users/user-groups/delete-group/delete-group.component';
import {CreateUserComponent} from './auth/users/create-user/create-user.component';
import {ManageUserComponent} from './auth/users/manage-user/manage-user.component';
import {CountriesComponent} from './auth/app/countries/countries.component';
import {DeleteRestoreUserComponent} from './auth/users/manage-user/delete-restore-user/delete-restore-user.component';
import {UserBaggageComponent} from './auth/users/manage-user/user-baggage/user-baggage.component';
import {SetBaggageComponent} from './auth/users/manage-user/user-baggage/set-baggage/set-baggage.component';
import {DeleteBaggageComponent} from './auth/users/manage-user/user-baggage/delete-baggage/delete-baggage.component';
import {CountriesTableComponent} from './auth/app/countries/countries-table/countries-table.component';
import {CountriesMoveModalComponent} from './auth/app/countries/countries-move-modal/countries-move-modal.component';
import {CountriesSetupModalComponent} from './auth/app/countries/countries-setup-modal/countries-setup-modal.component';
import {MailsComponent} from './auth/mails/mails.component';
import {MailsConfigComponent} from './auth/mails/mails-config/mails-config.component';
import {TotpModalComponent} from './shared/totp-modal/totp-modal.component';
import {PublicApiComponent} from './auth/public-api/public-api.component';
import {AccessConfigComponent} from './auth/public-api/access-config/access-config.component';
import {CachingComponent} from './auth/app/caching/caching.component';
import {ProgramConfigComponent} from './auth/app/program-config/program-config.component';
import {SystemConfigComponent} from './auth/app/program-config/system-config/system-config.component';
import {DbBackupsComponent} from './auth/app/db-backups/db-backups.component';
import {PublicSessionsComponent} from './auth/public-api/public-sessions/public-sessions.component';
import {PublicQueriesComponent} from './auth/public-api/public-queries/public-queries.component';

@NgModule({
  declarations: [
    time2StrPipe,
    momentPipe,
    momentRelativePipe,
    AppComponent,
    SigninComponent,
    FormFieldErrorComponent,
    AuthComponent,
    DashboardComponent,
    ButtonLoaderComponent,
    AuthAppComponent,
    DockerComponent,
    SpinnerIconComponent,
    AccountComponent,
    LogComponent,
    StaffComponent,
    PaginationComponent,
    ListComponent,
    TimestampDisplayComponent,
    InsertAdminComponent,
    EditAdminComponent,
    PermissionErrorComponent,
    AdminSessionsComponent,
    UserGroupsComponent,
    UsersComponent,
    SearchUsersComponent,
    CreateGroupComponent,
    EditGroupComponent,
    DeleteGroupComponent,
    CreateUserComponent,
    ManageUserComponent,
    CountriesComponent,
    DeleteRestoreUserComponent,
    UserBaggageComponent,
    SetBaggageComponent,
    DeleteBaggageComponent,
    CountriesTableComponent,
    CountriesMoveModalComponent,
    CountriesSetupModalComponent,
    MailsComponent,
    MailsConfigComponent,
    TotpModalComponent,
    PublicApiComponent,
    AccessConfigComponent,
    CachingComponent,
    ProgramConfigComponent,
    SystemConfigComponent,
    DbBackupsComponent,
    PublicSessionsComponent,
    PublicQueriesComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MdbAccordionModule,
    MdbAutocompleteModule,
    MdbCarouselModule,
    MdbChartModule,
    MdbCheckboxModule,
    MdbCollapseModule,
    MdbDatepickerModule,
    MdbDropdownModule,
    MdbFormsModule,
    MdbInfiniteScrollModule,
    MdbLazyLoadingModule,
    MdbLightboxModule,
    MdbLoadingModule,
    MdbModalModule,
    MdbNotificationModule,
    MdbPopconfirmModule,
    MdbPopoverModule,
    MdbRadioModule,
    MdbRangeModule,
    MdbRatingModule,
    MdbRippleModule,
    MdbScrollbarModule,
    MdbScrollspyModule,
    MdbSelectModule,
    MdbSidenavModule,
    MdbSmoothScrollModule,
    MdbStepperModule,
    MdbStickyModule,
    MdbTableModule,
    MdbTabsModule,
    MdbTimepickerModule,
    MdbTooltipModule,
    MdbValidationModule,
    BrowserAnimationsModule,
    ToastrModule.forRoot(),
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
