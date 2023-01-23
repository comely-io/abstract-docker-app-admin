import {Component, Input, OnDestroy, OnInit} from '@angular/core';
import {publicSession} from "../public-sessions.component";
import {MdbModalRef} from "mdb-angular-ui-kit/modal";

@Component({
  selector: 'app-pub-session-info',
  templateUrl: './pub-session-info.component.html',
  styleUrls: ['./pub-session-info.component.scss']
})
export class PubSessionInfoComponent implements OnInit, OnDestroy {
  @Input() session!: publicSession;

  constructor(public modal: MdbModalRef<PubSessionInfoComponent>) {
  }

  public searchFingerprint() {
    this.modal.close({searchFp: this.session.fingerprint});
  }

  ngOnInit(): void {
  }

  ngOnDestroy() {
  }
}
