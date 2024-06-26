/*
 * Copyright (c) 2016-2024 Broadcom. All Rights Reserved.
 * The term "Broadcom" refers to Broadcom Inc. and/or its subsidiaries.
 * This software is released under MIT license.
 * The full license information can be found in LICENSE in the root directory of this project.
 */

import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { ALL_COLUMN_CHANGES } from '../enums/column-changes.enum';
import { ColumnState, ColumnStateDiff } from '../interfaces/column-state.interface';

@Injectable()
export class ColumnsService {
  columns: BehaviorSubject<ColumnState>[] = [];

  private _cache: ColumnState[] = [];

  get columnStates(): ColumnState[] {
    return this.columns.map(column => column.value);
  }

  get hasHideableColumns(): boolean {
    return this.columnStates.filter(state => state.hideable).length > 0;
  }

  cache() {
    this._cache = this.columns.map(subject => {
      const value = { ...subject.value };
      delete value.changes;
      return value;
    });
  }

  hasCache() {
    return !!this._cache.length;
  }

  resetToLastCache() {
    this._cache.forEach((state, index) => {
      // Just emit the exact value from the cache
      this.columns[index].next({ ...state, changes: ALL_COLUMN_CHANGES });
    });
    this._cache = [];
  }

  // Helper method to emit a change to a column only when there is an actual diff to process for that column
  emitStateChangeAt(columnIndex: number, diff: ColumnStateDiff) {
    if (!this.columns[columnIndex]) {
      return;
    }
    this.emitStateChange(this.columns[columnIndex], diff);
  }

  emitStateChange(column: BehaviorSubject<ColumnState>, diff: ColumnStateDiff) {
    column.next({ ...column.value, ...diff });
  }
}
