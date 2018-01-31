import { combineReducers } from 'redux';
import { detailPanel } from './detail_panel';
import { indices } from './indices';
import { rowStatus } from './row_status';
import { tableState } from './table_state';

export const indexManagement = combineReducers({
  indices,
  rowStatus,
  tableState,
  detailPanel
});