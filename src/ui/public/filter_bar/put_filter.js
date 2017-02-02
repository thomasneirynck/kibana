import _ from 'lodash';

export default function () {

  let i = 0;
  return function ($state) {
    if (!_.isObject($state)) throw new Error('pushFilters requires a state object');
    return function (filter, negate, index, filterId) {
      // Hierarchical and tabular data set their aggConfigResult parameter
      // differently because of how the point is rewritten between the two. So
      // we need to check if the point.orig is set, if not use try the point.aggConfigResult
      const filters = _.clone($state.filters || []);
      let position = -1;
      if (filterId) {
        console.log('find identifier', filterId);
        filters.forEach((filter, ind) => {
          if (filterId === filter.meta._id) {
            position = ind;
          }
        });

        if (position > -1) {
          const pendingFilter = {meta: {negate: negate, index: index, _id: filterId}};
          _.extend(pendingFilter, filter);
          filters[position] = pendingFilter;
          $state.filters = filters;
          return filterId;
        } else {
          console.log('couldnt find anything');
        }
      }

      console.log('add new filter...');
      i++;
      const pendingFilter = {meta: {negate: negate, index: index, _id: i}};
      _.extend(pendingFilter, filter);
      filters.push(pendingFilter);
      $state.filters = filters;
      return i;

    };
  };
}
