export const ERROR_GROUP_SORTING_CHANGE = 'ERROR_GROUP_SORTING_CHANGE';

const INITIAL_STATE = {
  key: 'latestOccurrenceAt',
  descending: true
};

export default function errorGroupSorting(state = INITIAL_STATE, action) {
  switch (action.type) {
    case ERROR_GROUP_SORTING_CHANGE: {
      const initialDescending = action.key !== 'message';
      const descending =
        state.key === action.key ? !state.descending : initialDescending;
      return { ...state, key: action.key, descending };
    }
    default:
      return state;
  }
}

export function changeErrorGroupSorting(key) {
  return { type: ERROR_GROUP_SORTING_CHANGE, key };
}
