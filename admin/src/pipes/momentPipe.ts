import {Pipe, PipeTransform} from "@angular/core";
import * as moment from "moment"

@Pipe({
  name: "moment"
})
export class momentPipe implements PipeTransform {
  transform(value: any, format: string = 'D MMM YYYY, h:mm A'): any {
    let epoch = parseInt(value);
    return moment.unix(epoch).utc(false).format(format);
  }
}

@Pipe({
  name: "momentFromNow"
})
export class momentRelativePipe implements PipeTransform {
  transform(value: any): any {
    let epoch = parseInt(value);
    return moment.unix(epoch).utc(false).fromNow();
  }
}
