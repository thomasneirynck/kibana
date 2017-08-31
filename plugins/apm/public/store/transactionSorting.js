export const TRANSACTION_SORTING_CHANGE = 'TRANSACTION_SORTING_CHANGE';

const INITIAL_STATE = {
  key: 'impact',
  descending: true
};

export default function transactionSorting(state = INITIAL_STATE, action) {
  switch (action.type) {
    case TRANSACTION_SORTING_CHANGE: {
      const initialDecending = action.key !== 'name';
      const descending =
        state.key === action.key ? !state.descending : initialDecending;
      return { ...state, key: action.key, descending };
    }
    default:
      return state;
  }
}

export function changeTransactionSorting(key) {
  return { type: TRANSACTION_SORTING_CHANGE, key };
}

export const getSort = state => {
  const { key, descending } = state.transactionSorting;
  return (a, b) => {
    if (a[key] < b[key]) return descending ? 1 : -1;
    if (a[key] > b[key]) return descending ? -1 : 1;
    return 0;
  };
};
