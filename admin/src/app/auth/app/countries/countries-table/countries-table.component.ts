import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {country} from "../countries.component";
import {statusChangeQuery} from "../countries-move-modal/countries-move-modal.component";

export type countriesListType = "available" | "disabled";

@Component({
  selector: 'app-countries-table',
  templateUrl: './countries-table.component.html',
  styleUrls: ['./countries-table.component.scss']
})
export class CountriesTableComponent implements OnInit, OnDestroy {
  @Input() type!: countriesListType;
  @Input() list!: Array<country>;
  @Output() statusChangeQuery: EventEmitter<statusChangeQuery> = new EventEmitter<statusChangeQuery>();
  @Output() editCountryQuery: EventEmitter<country> = new EventEmitter<country>();

  public listCount: number = 0;
  public selectedCount: number = 0;

  constructor() {
  }

  public editCountry(country: country) {
    this.editCountryQuery.emit(country);
  }

  public changeSelectedStatus(countries: Array<string> | undefined = undefined) {
    if (!countries) {
      countries = [];
      this.list.forEach((country: country) => {
        if (country.checked) {
          countries?.push(country.code);
        }
      });
    }

    if (countries.length < 1) {
      return;
    }

    this.statusChangeQuery.emit({countries: countries, list: this.type === "available" ? "disabled" : "available"})
  }

  public toggleCountryCheck(index: number): void {
    if (this.list[index]) {
      let current: boolean = this.list[index].checked;
      if (current) {
        this.list[index].checked = false;
        this.selectedCount--;
      } else {
        this.list[index].checked = true;
        this.selectedCount++;
      }
    }
  }

  public selectAll(): void {
    this.selectedCount = 0;
    this.list.forEach((country: country, index: number) => {
      this.list[index].checked = true;
      this.selectedCount++;
    });
  }

  public unSelectAll(): void {
    this.list.forEach((country: country, index: number) => {
      this.list[index].checked = false;
    });

    this.selectedCount = 0;
  }

  ngOnInit(): void {
    this.listCount = this.list.length;
  }

  ngOnDestroy() {
  }
}
