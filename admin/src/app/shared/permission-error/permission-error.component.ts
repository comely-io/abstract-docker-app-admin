import {Component, Input, OnInit} from '@angular/core';

@Component({
  selector: 'app-permission-error',
  templateUrl: './permission-error.component.html',
  styleUrls: ['./permission-error.component.scss']
})
export class PermissionErrorComponent implements OnInit {
  @Input() goBackRouterLink?: string;
  @Input() cssClasses: string = "";

  constructor() {
  }

  ngOnInit(): void {
  }

}
