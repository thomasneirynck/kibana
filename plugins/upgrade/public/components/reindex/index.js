import _ from 'lodash';

import { ReindexView as StatelessReindexView } from './reindex_view';
import { withReindexOrchestrator } from './reindex_orchestrator';
import { withNavigationBlocker } from '../navigation_blocker';


export const ReindexView = _.compose(
  withReindexOrchestrator(),
  withNavigationBlocker({
    predicate: (state, props) => props.progress.running > 0,
  }),
)(StatelessReindexView);
