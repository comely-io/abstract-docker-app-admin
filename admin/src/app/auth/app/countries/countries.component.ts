import {Component, OnInit} from '@angular/core';
import {AppService} from "../../../../services/appService";
import {AdminPanelService} from "../../../../services/adminPanelService";
import {ApiQueryFail, ApiSuccess} from "../../../../services/apiService";
import {BehaviorSubject} from "rxjs";
import {MdbModalService} from "mdb-angular-ui-kit/modal";
import {CountriesMoveModalComponent, statusChangeQuery} from "./countries-move-modal/countries-move-modal.component";
import {CountriesSetupModalComponent} from "./countries-setup-modal/countries-setup-modal.component";

export interface countryListObject {
  [key: string]: country
}

export interface countryList {
  count: number,
  countries: countryListObject,
  available?: boolean | null,
  cachedOn: number
}

export interface countryEntry {
  name: string,
  code: string,
  codeShort: string,
  dialCode?: string | null,
}

export interface country extends countryEntry {
  available: number
  checked: boolean
}

@Component({
  selector: 'app-countries',
  templateUrl: './countries.component.html',
  styleUrls: ['./countries.component.scss']
})
export class CountriesComponent implements OnInit {
  public countriesListLoading: boolean = false;
  public countriesList?: countryList;
  public countriesAvailableList: Array<country> = [];
  public countriesDisabledList: Array<country> = [];

  public listUpdated: BehaviorSubject<number | string | null> = new BehaviorSubject<number | string | null>(null);

  constructor(private app: AppService, private aP: AdminPanelService, private modals: MdbModalService) {
  }

  public openStatusChangeModal(e: statusChangeQuery) {
    if (e.countries.length > 0) {
      this.modals.open(CountriesMoveModalComponent, {
        data: {
          countries: e.countries,
          list: e.list,
          updateEvent: this.listUpdated
        }
      });
    }
  }

  public openSetupModal(e: country | undefined) {
    this.modals.open(CountriesSetupModalComponent, {
      data: {
        country: e,
        updateEvent: this.listUpdated
      }
    })
  }

  public async refreshCountriesList(cache: boolean = false, clearCurrentList: boolean = true) {
    if (clearCurrentList) {
      this.countriesList = undefined;
    }

    this.countriesListLoading = true;
    await this.app.api.callServer("get", "/auth/countries", {
      action: "list",
      cached: cache,
    }).then((success: ApiSuccess) => {
      this.countriesList = <countryList>success.result.countries;
      this.countriesAvailableList = [];
      this.countriesDisabledList = [];

      if (this.countriesList && this.countriesList?.count > 0) {
        Object.keys(this.countriesList.countries).forEach((alpha3: string) => {
          if (this.countriesList?.countries.hasOwnProperty(alpha3)) {
            if (this.countriesList?.countries[alpha3].available === 1) {
              this.countriesAvailableList.push(this.countriesList.countries[alpha3]);
            } else {
              this.countriesDisabledList.push(this.countriesList.countries[alpha3]);
            }
          }
        });
      }
    }).catch((error: ApiQueryFail) => {
      this.app.handleAPIError(error);
    });

    this.countriesListLoading = false;
  }

  ngOnInit(): void {
    this.refreshCountriesList(true).then();

    this.listUpdated.subscribe((changes: number | string | null) => {
      if (typeof changes === "number" && changes > 0) {
        this.refreshCountriesList(false).then();
        this.app.notify.success(`${changes} countries have been updated!`);
      }

      if (typeof changes === "string") {
        this.refreshCountriesList(false).then();
        this.app.notify.success(`Country "${changes}" has been updated`);
      }
    });

    this.aP.breadcrumbs.next([
      {page: 'Application', active: true},
      {page: 'Countries', active: true, icon: 'fal fa-globe'}
    ]);
    this.aP.titleChange.next(["Countries List", "Application"]);
  }
}
