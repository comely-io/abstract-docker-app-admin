import {Component, OnInit} from '@angular/core';
import {AdminPanelService} from "../../../services/adminPanelService";
import {AppService} from "../../../services/appService";

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  public flashMessages: Array<string> = [];

  constructor(private app: AppService, private aP: AdminPanelService) {
  }

  public hideFlashWarning(index: number): void {
    this.flashMessages.splice(index, 1);
  }

  ngOnInit(): void {
    if (Array.isArray(this.app.flash.dashboard) && this.app.flash.dashboard.length > 0) {
      this.flashMessages = this.app.flash.dashboard;
      this.app.flash.dashboard = [];
    }

    this.aP.breadcrumbs.next([{page: "Dashboard", active: true}]);
    this.aP.titleChange.next(["Dashboard"]);
  }
}
