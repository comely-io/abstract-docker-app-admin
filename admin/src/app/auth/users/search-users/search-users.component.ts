import {Component, OnInit} from '@angular/core';
import {AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";

@Component({
  selector: 'app-search-users',
  templateUrl: './search-users.component.html',
  styleUrls: ['./search-users.component.scss']
})
export class SearchUsersComponent implements OnInit {
  public flashError?: string;

  constructor(private app: AppService, private aP: AdminPanelService) {
  }

  ngOnInit(): void {
    this.flashError = this.app.flash.userRetrieveFail;
  }

}
