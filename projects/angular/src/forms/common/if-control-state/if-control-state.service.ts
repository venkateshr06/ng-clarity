/*
 * Copyright (c) 2016-2023 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Injectable, OnDestroy } from '@angular/core';
import { NgControl } from '@angular/forms';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

import { NgControlService } from '../providers/ng-control.service';

export enum CONTROL_STATE {
  NONE = 'NONE',
  VALID = 'VALID',
  INVALID = 'INVALID',
}

@Injectable()
export class IfControlStateService implements OnDestroy {
  private subscriptions: Subscription[] = [];
  private controls: NgControl[] = [];

  // Implement our own status changes observable, since Angular controls don't
  private _statusChanges = new BehaviorSubject(CONTROL_STATE.NONE);

  constructor(private ngControlService: NgControlService) {
    // Wait for the control to be available
    this.subscriptions.push(
      this.ngControlService.controlChanges.subscribe(controls => {
        if (controls) {
          this.controls = controls;
          // Subscribe to the status change events, only after touched
          // and emit the control
          this.controls.forEach(control => {
            this.subscriptions.push(
              control.statusChanges?.subscribe(() => {
                this.triggerStatusChange();
              })
            );
          });
        }
      })
    );
  }

  get statusChanges(): Observable<CONTROL_STATE> {
    return this._statusChanges.asObservable();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  triggerStatusChange() {
    /* Check if control is defined and run the code only then */
    if (this.controls.length > 0) {
      // These status values are mutually exclusive, so a control
      // cannot be both valid AND invalid or invalid AND disabled.
      let finalStatus = CONTROL_STATE.NONE;
      const combinedStatus = this.controls.map(control => control.status);
      if (combinedStatus.includes(CONTROL_STATE.INVALID)) {
        finalStatus = CONTROL_STATE.INVALID;
      } else if (combinedStatus.includes(CONTROL_STATE.VALID)) {
        finalStatus = CONTROL_STATE.VALID;
      }
      this._statusChanges.next(finalStatus);
    }
  }
}
