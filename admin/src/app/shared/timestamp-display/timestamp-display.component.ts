import {Component, Input, OnDestroy, OnInit} from '@angular/core';

@Component({
  selector: 'app-timestamp-display',
  templateUrl: './timestamp-display.component.html',
  styleUrls: ['./timestamp-display.component.scss']
})
export class TimestampDisplayComponent implements OnInit, OnDestroy {
  @Input() epoch?: number | string;
  @Input() format?: string;
  @Input() cssClasses?: string;
  @Input() showEpoch: boolean = false;

  constructor() {
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
  }

}
