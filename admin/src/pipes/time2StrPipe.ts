import {Pipe, PipeTransform} from "@angular/core";
import {UtilsService} from "../services/utilsService";

@Pipe({
  name: "time2str"
})

export class time2StrPipe implements PipeTransform {
  transform(value: any): any {
    switch (typeof value) {
      case "string":
      case "number":
        return UtilsService.time2str(value);
      default:
        return value;
    }
  }
}
