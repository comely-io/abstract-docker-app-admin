import {Component, EventEmitter, Input, OnInit, Output, OnChanges} from '@angular/core';
import {FormControl} from "@angular/forms";

type paginationAlignment = "start" | "end" | "center";
type paginationSize = undefined | "lg" | "sm";

export interface paginationFilters {
  currentPage: number,
  perPage: number,
  totalRows: number
}

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss']
})
export class PaginationComponent implements OnInit, OnChanges {
  @Input() disabled: boolean = false;
  @Input() align: paginationAlignment = "start";
  @Input() size: paginationSize = undefined;
  @Input() shapeCircle: boolean = false;
  @Input() totalRows!: number;
  @Input() currentPage!: number;
  @Input() perPage!: number;
  @Input() pagesDisplayLimit?: number = undefined;
  @Input() boundaryLinks: boolean = true;
  @Input() nextBtnLabel: string = ">";
  @Input() lastBtnLabel: string = ">>";
  @Input() prevBtnLabel: string = "<";
  @Input() firstBtnLabel: string = "<<";

  @Output() changePage: EventEmitter<number> = new EventEmitter<number>();
  @Output() changePerPage: EventEmitter<number> = new EventEmitter<number>();

  public prevPages: Array<number> = [];
  public nextPages: Array<number> = [];

  public nextBtnPageNum?: number = undefined;
  public lastBtnPageNum?: number = undefined;
  public prevBtnPageNum?: number = undefined;
  public firstBtnDisabled: boolean = true;

  @Input() perPageOpts?: Array<number>;
  @Input() defaultPerPageOpt?: number;

  public searchPerPage: FormControl = new FormControl();

  constructor() {
  }

  private reset(): void {
    this.nextBtnPageNum = undefined;
    this.lastBtnPageNum = undefined;
    this.prevBtnPageNum = undefined;
    this.firstBtnDisabled = true;
    this.prevPages = [];
    this.nextPages = [];
  }

  public onPageChange(num?: number) {
    if (num) {
      this.changePage.emit(num);
    }
  }

  public onPerPageChange(e: any) {
    if (typeof e === "number") {
      this.changePerPage.emit(e);
    }
  }

  private refresh(): void {
    let totalPages: number = Math.ceil(this.totalRows / this.perPage);
    for (let i = 1; i <= totalPages; i++) {
      if (i === this.currentPage) {
        continue;
      }

      if (i < this.currentPage) {
        this.prevPages.push(i);
      } else {
        this.nextPages.push(i);
      }
    }

    this.firstBtnDisabled = this.currentPage === 1;

    if (this.boundaryLinks) {
      if (!this.pagesDisplayLimit) {
        this.pagesDisplayLimit = 3;
      }
    }

    if (this.pagesDisplayLimit) {
      if (this.prevPages.length > 0) {
        this.prevBtnPageNum = this.prevPages[this.prevPages.length - 1];
        this.prevPages = this.prevPages.slice(-1 * this.pagesDisplayLimit);
      }

      if (this.nextPages.length > 0) {
        this.nextBtnPageNum = this.nextPages[0];
        this.lastBtnPageNum = this.nextPages[this.nextPages.length - 1];
        this.nextPages = this.nextPages.slice(0, this.pagesDisplayLimit);
      }
    }
  }

  ngOnInit(): void {
    this.searchPerPage.setValue(this.defaultPerPageOpt);
    this.refresh();
  }

  ngOnChanges(): void {
    this.reset();
    this.refresh();
  }
}
