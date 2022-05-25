export class UtilsService {
  /**
   * Generates a random password
   * @param len
   * @param allowQuotes
   */
  public static randomPassword(len: number = 12, allowQuotes: boolean = false): string {
    if (len < 0) {
      throw new Error('Invalid password length');
    }

    let password: string = "";
    while (password.length < len) {
      let chr = Math.floor(Math.random() * (126 - 33 + 1)) + 33;
      if (!allowQuotes && [34, 39, 44, 96].indexOf(chr) > -1) {
        continue;
      }

      password += String.fromCharCode(chr);
    }
    return password;
  }

  /**
   * Convert timestamp to str
   * @param unixTs
   */
  public static time2str(unixTs: number | string) {
    if (typeof unixTs === "string") {
      unixTs = Math.floor((new Date(unixTs)).getTime() / 1000);
    }

    let timeFormats = [
      [60, 'seconds', 1], // 60
      [120, '1 minute ago', '1 minute from now'], // 60*2
      [3600, 'minutes', 60], // 60*60, 60
      [7200, '1 hour ago', '1 hour from now'], // 60*60*2
      [86400, 'hours', 3600], // 60*60*24, 60*60
      [172800, 'Yesterday', 'Tomorrow'], // 60*60*24*2
      [604800, 'days', 86400], // 60*60*24*7, 60*60*24
      [1209600, 'Last week', 'Next week'], // 60*60*24*7*4*2
      [2419200, 'weeks', 604800], // 60*60*24*7*4, 60*60*24*7
      [4838400, 'Last month', 'Next month'], // 60*60*24*7*4*2
      [29030400, 'months', 2419200], // 60*60*24*7*4*12, 60*60*24*7*4
      [58060800, 'Last year', 'Next year'], // 60*60*24*7*4*12*2
      [2903040000, 'years', 29030400], // 60*60*24*7*4*12*100, 60*60*24*7*4*12
      [5806080000, 'Last century', 'Next century'], // 60*60*24*7*4*12*100*2
      [58060800000, 'centuries', 2903040000] // 60*60*24*7*4*12*100*20, 60*60*24*7*4*12*100
    ];

    let currentTs = Math.floor((new Date()).getTime() / 1000);
    let secondsSince = currentTs - unixTs;
    let token = "ago";
    let listChoice = 1;

    if (secondsSince == 0) {
      return "Just now";
    }

    if (secondsSince < 0) {
      secondsSince = Math.abs(secondsSince);
      token = "from now";
      listChoice = 2;
    }

    let i = 0, format;
    while (format = timeFormats[i++])
      if (secondsSince < format[0]) {
        if (typeof format[2] == "string")
          return format[listChoice];
        else
          return Math.floor(secondsSince / format[2]) + ' ' + format[1] + ' ' + token;
      }

    return unixTs;
  }
}
