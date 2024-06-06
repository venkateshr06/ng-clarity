/*
 * Copyright (c) 2016-2023 VMware, Inc. All Rights Reserved.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Directive, EmbeddedViewRef, Input, Optional, TemplateRef, ViewContainerRef } from '@angular/core';
import { NgControl } from '@angular/forms';

import { NgControlService } from '../providers/ng-control.service';
import { AbstractIfState } from './abstract-if-state';
import { CONTROL_STATE, IfControlStateService } from './if-control-state.service';

@Directive({
  selector: '[clrIfError]',
})
export class ClrIfError extends AbstractIfState {
  @Input('clrIfError') error: string;

  private embeddedViewRef: EmbeddedViewRef<any>;

  constructor(
    @Optional() ifControlStateService: IfControlStateService,
    @Optional() ngControlService: NgControlService,
    private template: TemplateRef<any>,
    private container: ViewContainerRef
  ) {
    super(ifControlStateService, ngControlService);

    if (!this.ifControlStateService) {
      throw new Error('clrIfError can only be used within a form control container element like clr-input-container');
    }
  }
  /**
   * @param state CONTROL_STATE
   */
  protected override handleState(state: CONTROL_STATE) {
    if (this.error) {
      this.controls.forEach(control => {
        if (control.invalid) {
          this.displayError(control.hasError(this.error), control);
          return;
        }
      });
    }
    // I think we shouldn't be able to get here
    this.displayError(CONTROL_STATE.INVALID === state);
  }

  private displayError(invalid: boolean, control: NgControl = null) {
    /* if no container do nothing */
    if (!this.container) {
      return;
    }
    if (invalid) {
      if (this.displayedContent === false) {
        this.embeddedViewRef = this.container.createEmbeddedView(this.template, {
          error: control ? control.getError(this.error) : '',
        });
        this.displayedContent = true;
      } else if (this.embeddedViewRef && this.embeddedViewRef.context) {
        // if view is already rendered, update the error object to keep it in sync
        this.embeddedViewRef.context.error = control ? control.getError(this.error) : '';
      }
    } else {
      this.container.clear();
      this.displayedContent = false;
    }
  }
}
