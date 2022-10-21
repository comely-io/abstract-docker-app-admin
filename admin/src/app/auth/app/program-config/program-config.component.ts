import {Component, OnInit} from '@angular/core';
import {AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";

@Component({
  selector: 'app-program-config',
  templateUrl: './program-config.component.html',
  styleUrls: ['./program-config.component.scss']
})
export class ProgramConfigComponent implements OnInit {

  public formsDisabled: boolean = false;

  constructor(private app: AppService, private aP: AdminPanelService) {
  }

  ngOnInit(): void {
    this.aP.breadcrumbs.next([
      {page: 'Application', active: true},
      {page: 'Configuration', active: true, icon: "fal fa-cogs"}
    ]);
    this.aP.titleChange.next(["Configuration", "Application"]);
  }
}
