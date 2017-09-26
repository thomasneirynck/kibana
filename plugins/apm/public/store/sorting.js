export const SORTING_CHANGE = 'SORTING_CHANGE';

const INITIAL_STATE = {
  transaction: {
    key: 'impact',
    descending: true
  },
  errorGroup: {
    key: 'latestOccurrenceAt',
    descending: true
  },
  app: {
    key: 'appName',
    descending: false
  }
};

const INITIALLY_DESCENDING = {
  transaction: ['name'],
  errorGroup: ['message'],
  app: ['appName']
};

function getSorting(state, action) {
  const isInitiallyDescending = INITIALLY_DESCENDING[action.section].includes(
    action.key
  );
  const descending =
    state.key === action.key ? !state.descending : isInitiallyDescending;
  return { ...state, key: action.key, descending };
}

export default function sorting(state = INITIAL_STATE, action) {
  switch (action.type) {
    case SORTING_CHANGE: {
      return {
        ...state,
        [action.section]: getSorting(state[action.section], action)
      };
    }
    default:
      return state;
  }
}

export const changeTransactionSorting = key => ({
  type: SORTING_CHANGE,
  key,
  section: 'transaction'
});

export const changeErrorGroupSorting = key => ({
  type: SORTING_CHANGE,
  key,
  section: 'errorGroup'
});

export const changeAppSorting = key => ({
  type: SORTING_CHANGE,
  key,
  section: 'app'
});
