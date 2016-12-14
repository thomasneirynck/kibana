import _ from 'lodash';

function filterAggTypes(aggTypes) {
  const filteredAggTypes = [];
  let typeCopy;
  _.each(aggTypes, (type) => {
    type.prlName = type.name;
    type.prlDebugAgg = {max:type.name, min: type.name};

    _.each(type.params, (p) => {
      if (p.filterFieldTypes) {
        p.filterFieldTypes = p.filterFieldTypes.replace(',date', '');
      }
    });

    if (type.name === 'count') {
      type.prlDebugAgg = {max: 'max', min: 'min'};
      filteredAggTypes.push(type);

      typeCopy = _.clone(type);
      typeCopy.prlName = 'high_count';
      typeCopy.title   = 'High count';
      typeCopy.prlDebugAgg = {max: 'max', min: 'min'};
      filteredAggTypes.push(typeCopy);

      typeCopy = _.clone(type);
      typeCopy.prlName = 'low_count';
      typeCopy.title   = 'Low count';
      typeCopy.prlDebugAgg = {max: 'max', min: 'min'};
      filteredAggTypes.push(typeCopy);

    } else if (type.name === 'sum') {
      filteredAggTypes.push(type);

      typeCopy = _.clone(type);
      typeCopy.prlName = 'high_sum';
      typeCopy.title   = 'High sum';
      filteredAggTypes.push(typeCopy);

      typeCopy = _.clone(type);
      typeCopy.prlName = 'low_sum';
      typeCopy.title   = 'Low sum';
      filteredAggTypes.push(typeCopy);

    } else if (type.name === 'avg') {
      type.prlName = 'mean';
      filteredAggTypes.push(type);

      typeCopy = _.clone(type);
      typeCopy.prlName = 'high_mean';
      typeCopy.title   = 'High average';
      filteredAggTypes.push(typeCopy);

      typeCopy = _.clone(type);
      typeCopy.prlName = 'low_mean';
      typeCopy.title   = 'Low average';
      filteredAggTypes.push(typeCopy);

    } else if (type.name === 'min') {
      filteredAggTypes.push(type);
    } else if (type.name === 'max') {
      filteredAggTypes.push(type);
    } else if (type.name === 'cardinality') {
      type.prlDebugAgg = {max: 'max', min: 'min'};
      type.prlName = 'distinct_count';

      _.each(type.params, (p) => {
        if (p.filterFieldTypes) {
          p.filterFieldTypes = 'number,boolean,ip,string';
        }
      });

      filteredAggTypes.push(type);
    }
  });
  return filteredAggTypes;
}

module.exports = filterAggTypes;