export const REINDEX_STEP_SEQUENCE = [
  'CREATE_INDEX',
  'SET_READONLY',
  'REINDEX',
  'REFRESH_INDEX',
  'VERIFY_DOCS',
  'REPLACE_INDEX',
];

export const REINDEX_STEPS = REINDEX_STEP_SEQUENCE
  .reduce((steps, step) => ({
    ...steps,
    [step]: step,
  }), {});

export const UPGRADE_STEP_SEQUENCE = [
  'UPGRADE',
];

export const UPGRADE_STEPS = UPGRADE_STEP_SEQUENCE
  .reduce((steps, step) => ({
    ...steps,
    [step]: step,
  }), {});

export const NUMBER_OF_STEPS = {
  REINDEX: REINDEX_STEP_SEQUENCE.length,
  UPGRADE: UPGRADE_STEP_SEQUENCE.length,
};

export const STEP_RESULTS = {
  COMPLETED:   'COMPLETED',
  FAILED:      'FAILED',
  RUNNING:     'RUNNING',
  NOT_STARTED: 'NOT_STARTED',
  CANCELED:    'CANCELED',
};

export const INDEX_ACTION = {
  TYPE: {
    REINDEX: 'REINDEX',
    UPGRADE: 'UPGRADE',
  },
  LABEL: {
    REINDEX: 'Reindex',
    UPGRADE: 'Upgrade',
  },
};
