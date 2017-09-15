export const TRANSACTION_SORTING_CHANGE = 'TRANSACTION_SORTING_CHANGE';

const INITIAL_STATE = {
  key: 'impact',
  descending: true
};

export default function transactionSorting(state = INITIAL_STATE, action) {
  switch (action.type) {
    case TRANSACTION_SORTING_CHANGE: {
      const initialDescending = action.key !== 'name';
      const descending =
        state.key === action.key ? !state.descending : initialDescending;
      return { ...state, key: action.key, descending };
    }
    default:
      return state;
  }
}

export function changeTransactionSorting(key) {
  return { type: TRANSACTION_SORTING_CHANGE, key };
}
