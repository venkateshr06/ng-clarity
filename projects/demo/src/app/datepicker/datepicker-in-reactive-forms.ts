/*
 * Copyright (c) 2016-2024 Broadcom. All Rights Reserved.
 * The term "Broadcom" refers to Broadcom Inc. and/or its subsidiaries.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

@Component({
  selector: 'clr-datepicker-in-reactive-forms-demo',
  styleUrls: ['./datepicker.demo.scss'],
  templateUrl: './datepicker-in-reactive-forms.html',
})
export class DatepickerInReactiveForms {
  dateForm = new FormGroup({
    date: new FormControl('03/05/2018'),
    startDate: new FormControl(),
    endDate: new FormControl(),
  });

  minDate = '2023-02-05';
  maxDate = '2026-02-22';

  dateChanged(date: Date) {
    console.log(date);
  }

  stDateChanged(date: Date) {
    console.log(date);
  }

  endDateChanged(date: Date) {
    console.log(date);
  }

  ngOnInit() {
    // this.dateForm.get('date').patchValue('02/02/2024')
  }
}
