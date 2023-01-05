import {ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';
import {AppService} from "../../services/appService";
import {AdminPanelService, breadcrumb} from "../../services/adminPanelService";
import {Title} from "@angular/platform-browser";
import {ApiWarningMsg} from "../../services/apiService";
import {Subscription} from "rxjs";

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit, OnDestroy {
  public appName: string;
  public displaySidenav: boolean;
  public screenSize: number;
  public breadcrumbs: Array<breadcrumb> = [];
  public apiWarnings: Array<ApiWarningMsg> = [];

  private watchers: Array<Subscription> = [];

  constructor(private app: AppService, private adminPanel: AdminPanelService, private titleChange: Title, private cdr: ChangeDetectorRef) {
    this.appName = app.appName;
    this.screenSize = window.innerWidth;
    this.displaySidenav = window.innerWidth >= 769;
  }

  deleteAPIWarning(index: number) {
    this.apiWarnings.splice(index, 1);
  }

  getWarningAlertColor(type: number) {
    switch (type) {
      case 8:
      case 1024:
        return "alert-warning";
      default:
        return "alert-danger";
    }
  }

  ngOnInit(): void {
    this.watchers.push(this.adminPanel.breadcrumbs.subscribe((change: Array<breadcrumb>) => {
      let breadcrumbs = [];
      breadcrumbs.push({page: "Home", link: "dashboard", icon: "fal fa-home"});
      change.forEach(function (breadcrumb: breadcrumb) {
        breadcrumbs.push(breadcrumb);
      })

      this.breadcrumbs = breadcrumbs;
      this.cdr.detectChanges();
    }));

    this.watchers.push(this.adminPanel.titleChange.subscribe((pageTitle: Array<string>) => {
      this.titleChange.setTitle(pageTitle.concat([this.appName]).join(" / "))
      this.cdr.detectChanges();
    }));

    this.watchers.push(this.app.router.events.subscribe(() => {
      this.apiWarnings = [];
    }));

    this.watchers.push(this.app.events.apiCallWarnings().subscribe((warnings: ApiWarningMsg[]) => {
      if (warnings.length) {
        warnings.forEach((msg: ApiWarningMsg) => {
          this.apiWarnings.push(msg);
        });

        this.cdr.detectChanges();
      }
    }));
  }

  ngOnDestroy() {
    this.watchers.forEach((watcher: Subscription) => {
      watcher.unsubscribe();
    });
  }
}
