/*
 * Copyright (c) 2016-2023 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Injectable } from '@angular/core';

import { DateRange } from '../interfaces/date-range.interface';
import { DayModel } from '../model/day.model';
import {
  BIG_ENDIAN,
  CUSTOM,
  DEFAULT_LOCALE_FORMAT,
  EXTRACT_DELIMITER_REGEX,
  InputDateDisplayFormat,
  LITTLE_ENDIAN,
  LITTLE_ENDIAN_REGEX,
  MIDDLE_ENDIAN,
  MIDDLE_ENDIAN_REGEX,
  RTL_REGEX,
} from '../utils/constants';
import { extractDateParts, getFormatDate, getNumberOfDaysInTheMonth, parseToFourDigitYear } from '../utils/date-utils';
import { LocaleHelperService } from './locale-helper.service';
import { ViewManagerService } from './view-manager.service';

@Injectable()
export class DateIOService {
  disabledDates: DateRange = {
    // This is the default range. It approximates the beginning of time to the end of time.
    // Unless a minDate or maxDate is set with the native HTML5 api the range is all dates
    // TODO: turn this into an Array of min/max ranges that allow configuration of multiple ranges.
    minDate: new DayModel(0, 0, 1),
    maxDate: new DayModel(9999, 11, 31),
  };
  isDateRangePicker = false;
  cldrLocaleDateFormat: string = DEFAULT_LOCALE_FORMAT;
  defaultView = '';

  private inputDateFormat;
  private dateRangeOptions;
  private localeDisplayFormat: InputDateDisplayFormat = LITTLE_ENDIAN;
  private delimiter = '/';

  constructor(private _viewManagerService: ViewManagerService, private _localeHelperService: LocaleHelperService) {
    this.cldrLocaleDateFormat = this._localeHelperService.localeDateFormat;
    this.initializeLocaleDisplayFormat();
  }

  get placeholderText(): string {
    const format: string = this.localeDisplayFormat.format;
    return format.replace(/[-\\/.]/g, this.delimiter);
  }

  setMinDate(date: string): void {
    // NOTE: I'm expecting consumers to pass one of four things here:
    //       A proper date string(2019-11-11), null, undefined or empty string ('')
    if (!date) {
      // attribute binding was removed, reset back to the beginning of time
      this.disabledDates.minDate = new DayModel(0, 0, 1);
    } else {
      const [year, month = 1, day = 1] = date.split('-').map(n => parseInt(n, 10));
      this.disabledDates.minDate = new DayModel(year, month - 1, day);
    }
    console.log('🚀 ~ DateIOService ~ setMinDate ~ this.disabledDates:', this.disabledDates);
  }

  setMaxDate(date: string): void {
    // NOTE: I'm expecting consumers to pass one of four things here:
    //       A proper date string(2019-11-11), null, undefined or empty string ('')
    if (!date) {
      // attribute binding was removed, reset forward to the end of time
      this.disabledDates.maxDate = new DayModel(9999, 11, 31);
    } else {
      const [year, month, day] = date.split('-').map(n => parseInt(n, 10));
      this.disabledDates.maxDate = new DayModel(year, month - 1, day);
    }
    console.log('🚀 ~ DateIOService ~ setMaxDate ~ this.disabledDates:', this.disabledDates);
  }

  setIsDateRangePicker(flag: boolean) {
    this.isDateRangePicker = flag;
  }

  setRangeOptions(rangeOptions) {
    let validatedRangeOption = this.validateDateRangeOptions(rangeOptions);
    console.log('🚀 ~ DateIOService ~ setRangeOptions ~ validatedRangeOption:', validatedRangeOption);
    if (validatedRangeOption.length) {
      validatedRangeOption = [...validatedRangeOption, { label: 'Custom Range', value: [] }];
      this.dateRangeOptions = validatedRangeOption;
    }
  }

  getRangeOptions() {
    return this.dateRangeOptions;
  }

  setDateFormat(dateFormat: string) {
    this.inputDateFormat = dateFormat;
    this.cldrLocaleDateFormat = dateFormat;
    this.initializeLocaleDisplayFormat();
    this.setDefaultCalendarView();
  }

  setDefaultCalendarView() {
    if (this.isDayViewAllowed()) {
      this._viewManagerService.changeToDayView();
    } else if (this.isMonthViewAllowed()) {
      this._viewManagerService.changeToMonthView();
    } else if (this.isYearViewAllowed()) {
      this._viewManagerService.changeToYearView();
    }
  }

  isMonthViewAllowed(dateFormat: string = this.cldrLocaleDateFormat) {
    return /m./i.test(dateFormat);
  }

  isDayViewAllowed(dateFormat: string = this.cldrLocaleDateFormat) {
    return /d./i.test(dateFormat);
  }

  isYearViewAllowed(dateFormat: string = this.cldrLocaleDateFormat) {
    return /y./i.test(dateFormat);
  }

  toLocaleDisplayFormatString(date: Date): string {
    if (date) {
      if (isNaN(date.getTime())) {
        return '';
      }
      // const dateNo: number = date.getDate();
      // const monthNo: number = date.getMonth() + 1;
      // const dateStr: string = dateNo > 9 ? dateNo.toString() : '0' + dateNo;
      // const monthStr: string = monthNo > 9 ? monthNo.toString() : '0' + monthNo;
      return getFormatDate(date, this.localeDisplayFormat.format, this.delimiter);
      // if (this.localeDisplayFormat === LITTLE_ENDIAN) {
      //   return dateStr + this.delimiter + monthStr + this.delimiter + date.getFullYear();
      // } else if (this.localeDisplayFormat === MIDDLE_ENDIAN) {
      //   return monthStr + this.delimiter + dateStr + this.delimiter + date.getFullYear();
      // } else {
      //   return date.getFullYear() + this.delimiter + monthStr + this.delimiter + dateStr;
      // }
    }
    return '';
  }

  getDateValueFromDateString(date: string): Date {
    if (!date || typeof date !== 'string') {
      return null;
    }
    const dateParts: string[] = extractDateParts(date, this.localeDisplayFormat.format);
    return this.validateAndGetDate(dateParts[0], dateParts[1], dateParts[2]);
    // const dateParts: string[] = date.match(USER_INPUT_REGEX);
    // if (!dateParts || dateParts.length !== 3) {
    //   return null;
    // }
    // const [firstPart, secondPart, thirdPart] = dateParts;
    // if (this.localeDisplayFormat === LITTLE_ENDIAN) {
    //   // secondPart is month && firstPart is date
    //   return this.validateAndGetDate(thirdPart, secondPart, firstPart);
    // } else if (this.localeDisplayFormat === MIDDLE_ENDIAN) {
    //   // firstPart is month && secondPart is date
    //   return this.validateAndGetDate(thirdPart, firstPart, secondPart);
    // } else {
    //   // secondPart is month && thirdPart is date
    //   return this.validateAndGetDate(firstPart, secondPart, thirdPart);
    // }
  }

  private initializeLocaleDisplayFormat(): void {
    const format: string = this.cldrLocaleDateFormat.toLocaleLowerCase();
    if (this.inputDateFormat) {
      const customDateFormat = Object.assign({}, CUSTOM, { format: this.inputDateFormat });
      this.localeDisplayFormat = customDateFormat;
    } else if (LITTLE_ENDIAN_REGEX.test(format)) {
      this.localeDisplayFormat = LITTLE_ENDIAN;
    } else if (MIDDLE_ENDIAN_REGEX.test(format)) {
      this.localeDisplayFormat = MIDDLE_ENDIAN;
    } else {
      // everything else is set to BIG-ENDIAN FORMAT
      this.localeDisplayFormat = BIG_ENDIAN;
    }
    this.extractDelimiters();
  }

  private extractDelimiters(): void {
    if (this.cldrLocaleDateFormat) {
      // Sanitize Date Format. Remove RTL characters.
      // FIXME: When we support RTL, remove this and handle it correctly.
      const localeFormat: string = this.cldrLocaleDateFormat.replace(RTL_REGEX, '');
      // const delimiters: string[] = localeFormat.split(DELIMITER_REGEX);
      const delimiters: string[] = localeFormat.match(EXTRACT_DELIMITER_REGEX) || [];
      // NOTE: The split from the CLDR date format should always result
      // in an arary with 4 elements. The 1st and the 2nd values are the delimiters
      // we will use in order.
      // Eg: "dd/MM/y".split(/d+|m+|y+/i) results in ["", "/", "/", ""]
      this.delimiter = delimiters[0] || '';
      console.log('🚀 ~ DateIOService ~ extractDelimiters ~ delimiters:', this.delimiter);
      // if (delimiters && delimiters.length === 4) {
      // } else {
      //   console.error('Unexpected date format received. Delimiters extracted: ', delimiters);
      // }
    }
  }

  /**
   * Checks if the month entered by the user is valid or not.
   * Note: Month is 0 based.
   */
  private isValidMonth(month: number): boolean {
    return month > -1 && month < 12;
  }

  /**
   * Checks if the date is valid depending on the year and month provided.
   */
  private isValidDate(year: number, month: number, date: number): boolean {
    return date > 0 && date <= getNumberOfDaysInTheMonth(year, month);
  }

  private monthNumberFromString(str) {
    const mn = new Date(`${str} 01 2024`).toLocaleDateString(`en`, { month: `2-digit` });
    return mn;
  }

  /**
   * Validates the parameters provided and returns the date.
   * If the parameters are not
   * valid then return null.
   * NOTE: (Month here is 1 based since the user has provided that as an input)
   */
  private validateAndGetDate(year: string, month: string, date: string): Date {
    // I don't know whats wrong with the TS compiler. It throws an error if I write
    // the below if statement. The error is:
    // Operator '!==' cannot be applied to types '2' and '4'
    // More info here: https://github.com/Microsoft/TypeScript/issues/12794#issuecomment-270342936
    /*
        if (year.length !== 2 || year.length !== 4) {
            return null;
        }
        */
    const y: number = +year;
    const m: any = typeof month === 'string' ? +this.monthNumberFromString(month) - 1 : +month - 1; // month is 0 based
    // const m: any = +month - 1; // month is 0 based
    const d: number = +date;
    if ((m && !this.isValidMonth(m)) || (d && !this.isValidDate(y, m, d))) {
      return null;
    }
    const result: number = parseToFourDigitYear(y);
    return result !== -1 ? new Date(result, m || 1, d || 1) : null;
  }

  private validateDateRangeOptions(rangeOptions) {
    const validOptions = [];
    rangeOptions?.forEach(rangeOption => {
      if (
        !rangeOption.value?.length ||
        rangeOption.value?.length !== 2 ||
        Object.prototype.toString.call(rangeOption.value[0]) !== '[object Date]' ||
        Object.prototype.toString.call(rangeOption.value[1]) !== '[object Date]'
      ) {
        return;
      }
      validOptions.push(rangeOption);
    });
    return validOptions;
  }
}
