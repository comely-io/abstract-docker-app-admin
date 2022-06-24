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
