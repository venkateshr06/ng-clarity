/*
 * Copyright (c) 2016-2024 Broadcom. All Rights Reserved.
 * The term "Broadcom" refers to Broadcom Inc. and/or its subsidiaries.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import {
  Directive,
  EmbeddedViewRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { Subscription } from 'rxjs';

import { DetailService } from './providers/detail.service';

@Directive({
  selector: '[clrIfDetail]',
})
export class ClrIfDetail implements OnInit, OnDestroy {
  @Output('clrIfDetailChange') stateChange = new EventEmitter<any>(null);

  private subscriptions: Subscription[] = [];
  private skip = false; // This keeps us from resetting the input and calling the toggle twice
  private embeddedViewRef: EmbeddedViewRef<any>;

  constructor(
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef,
    private detailService: DetailService
  ) {
    this.detailService.enabled = true;
  }

  @Input('clrIfDetail')
  set state(model: any) {
    if (!this.skip) {
      this.detailService.toggle(model);
    }
    this.skip = false;
  }

  ngOnInit() {
    this.subscriptions.push(
      this.detailService.stateChange.subscribe(state => {
        if (state === true) {
          this.togglePanel(true);
        } else {
          this.togglePanel(false);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private togglePanel(showPanel: boolean) {
    let stateChangeParams = null;

    if (showPanel === true) {
      const embeddedViewContext = { $implicit: this.detailService.state };

      if (this.embeddedViewRef) {
        this.embeddedViewRef.context = embeddedViewContext;
      } else {
        this.embeddedViewRef = this.viewContainer.createEmbeddedView(this.templateRef, embeddedViewContext);
      }

      this.skip = true;
      stateChangeParams = this.detailService.state;
    } else {
      this.viewContainer.clear();
      this.embeddedViewRef = null;
    }

    this.stateChange.emit(stateChangeParams);
  }
}
