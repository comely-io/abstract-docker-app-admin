import {AppService} from "./appService";

export type totpCallbackFn = (code: string) => void;

export class ValidatorService {
  public constructor(private _app: AppService) {
  }

  /**
   * Checks if argument looks like a valid phone number
   * @param arg
   */
  public isValidPhNum(arg: any): boolean {
    return typeof arg === "string" && /^\+\d{1,6}\.\d{4,16}$/.test(arg);
  }

  /**
   * Clear out totp input field on focus
   * @param e
   */
  public focusTotpField(e: any) {
    e.target.value = "";
  }

  /**
   * Parse TOTP field input; call the callback fn if totpCode length is 6
   * @param e
   * @param submitCallback
   */
  public parseTotpField(e: any, submitCallback?: totpCallbackFn) {
    let enteredCode = e.target.value;
    if (typeof enteredCode === "string") {
      enteredCode = enteredCode.replace(/\D/, '');
      e.target.value = enteredCode;
    }

    if (enteredCode.length === 6 && submitCallback) {
      submitCallback(enteredCode);
    }
  }

  /**
   * Validates GoogleAuth TOTP code
   * @param totpCode
   */
  public validateTotp(totpCode: any): string {
    if (typeof totpCode !== "string" || !totpCode.length) {
      throw new Error('2FA TOTP code is required');
    }

    if (!/^\d{6}$/.test(totpCode)) {
      throw new Error('Incomplete/Invalid TOTP code');
    }

    return totpCode;
  }

  /**
   * Validates input as ASCII string
   * @param input
   * @param required
   */
  public validateInput(input: any, required: boolean = true): string {
    if (typeof input === "number") {
      input = input.toString();
    }

    if (typeof input !== "string") {
      if (required) {
        throw new Error('This field is required');
      }

      return "";
    }

    if (!this.isASCII(input, true, false)) {
      throw new Error('Input contains an illegal character');
    }

    return input;
  }

  /**
   * Validates a username
   * @param username
   */
  public validateUsername(username: any): string {
    if (typeof username !== "string" || !username.length) {
      throw new Error('Username is required');
    }

    if (!/^[a-zA-Z\d]+[a-zA-Z\d\-_]?[a-zA-Z\d]+$/.test(username)) {
      throw new Error('Username contains an illegal character');
    }

    let usernameLen = username.length;

    if (usernameLen < 6) {
      throw new Error('Username must be 6 characters long');
    } else if (usernameLen > 16) {
      throw new Error('Username cannot exceed 16 characters');
    }

    return username;
  }

  /**
   * Validates a password
   * @param password
   * @param label
   */
  public validatePassword(password: any, label: string = 'Password'): string {
    if (typeof password !== "string" || !password.length) {
      throw new Error(label + ' is required');
    }

    if (!this.isASCII(password, true, false)) {
      throw new Error(label + ' contains illegal character');
    }

    if (password.length < 8) {
      throw new Error(label + ' must be at least 8 characters');
    }

    if (password.length > 32) {
      throw new Error(label + ' cannot exceed 32 characters');
    }

    return password;
  }

  /**
   * Validates an e-mail address
   * @param email
   * @param maxLen
   */
  public validateEmail(email: any, maxLen: number = 32): string {
    if (typeof email !== "string" || !email.length) {
      throw new Error('E-mail address is required');
    }

    if (!this.isValidEmail(email)) {
      throw  new Error('Invalid e-mail address');
    }

    if (email.length > maxLen) {
      throw new Error('E-mail address must not exceed 32 characters');
    }

    return email;
  }

  /**
   * Checks if argument e-mail address is valid
   * @param email
   */
  public isValidEmail(email: any): boolean {
    if (typeof email !== "string") {
      return false;
    }

    return /^\w+@[a-z\d]+(\.[a-z\d]{2,8}){1,3}$/.test(email);
  }

  /**
   * Checks if string is ASCII (printable OR upto index 127 OR 255)
   * @param str
   * @param printable
   * @param extended
   */
  public isASCII(str: string, printable: boolean = true, extended: boolean = false): boolean {
    if (printable) {
      return /^[\x20-\x7E]*$/i.test(str);
    }

    return (extended ? /^[\x00-\xFF]*$/ : /^[\x00-\x7F]*$/).test(str);
  }

  /**
   * @param value
   * @param retain
   * @param trimRetain
   */
  public cleanDecimals(value: any, retain?: number, trimRetain?: boolean): string {
    let clean: string = value.toString();
    if (clean.indexOf(".") > -1) {
      clean = clean.replace(/0*$/g, '');
      clean = clean.replace(/\.$/g, '');
    }

    if (retain) {
      retain = parseInt(retain.toString());
      if (retain > 0) {
        let amount = clean.split(".");
        let decimals = amount[1] ?? "";
        let has: number = decimals.length;
        let needed: number = retain - has;
        if (needed > 0) {
          let zero: string = "0";
          decimals = decimals + zero.repeat(needed);
        }

        if (has > retain) {
          if (typeof trimRetain === "boolean" && trimRetain) {
            decimals = decimals.substr(0, retain);
          }
        }

        clean = amount[0] + "." + decimals;
      }
    }

    return clean;
  }
}
