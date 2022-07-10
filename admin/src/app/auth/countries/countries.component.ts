import {Component, OnInit} from '@angular/core';

export interface countryListArray {
  [key: string]: countryEntry
}

export interface countryList {
  count: number,
  countries: countryListArray,
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
}

@Component({
  selector: 'app-countries',
  templateUrl: './countries.component.html',
  styleUrls: ['./countries.component.scss']
})
export class CountriesComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }

}
