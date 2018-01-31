import {
  INDEX_CLEARING_CACHE,
  INDEX_CLOSED,
  INDEX_CLOSING,
  INDEX_MERGING,
  INDEX_OPENING,
  INDEX_REFRESHING,
  INDEX_FLUSHING,
  INDEX_FORCEMERGING,
} from '../../common/constants';

export const indexStatusLabels = {
  [INDEX_CLEARING_CACHE]: 'clearing cache...',
  [INDEX_CLOSED]: 'closed',
  [INDEX_CLOSING]: 'closing...',
  [INDEX_MERGING]: 'merging...',
  [INDEX_OPENING]: 'opening...',
  [INDEX_REFRESHING]: 'refreshing...',
  [INDEX_FLUSHING]: 'flushing...',
  [INDEX_FORCEMERGING]: 'forcing merge...'
};
