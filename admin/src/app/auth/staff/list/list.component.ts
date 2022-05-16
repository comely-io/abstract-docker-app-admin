import {Component, OnInit} from '@angular/core';

export interface staffMember {
  id: number,
  status: boolean,
  email: string,
  phone?: string,
  checksum: boolean,
  isRoot: boolean
}

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']
})
export class ListComponent implements OnInit {

  constructor() {
  }

  ngOnInit(): void {
  }

}
