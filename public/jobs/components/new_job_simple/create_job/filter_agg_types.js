import _ from 'lodash';

function filterAggTypes(aggTypes) {
  const filteredAggTypes = [];
  let typeCopy;
  _.each(aggTypes, (type) => {
    type.mlName = type.name;
    type.mlDebugAgg = {max:type.name, min: type.name};

    _.each(type.params, (p) => {
      if (p.filterFieldTypes) {
        p.filterFieldTypes = p.filterFieldTypes.replace(',date', '');
      }
    });

    if (type.name === 'count') {
      type.mlDebugAgg = {max: 'max', min: 'min'};
      filteredAggTypes.push(type);

      typeCopy = _.clone(type);
      typeCopy.mlName = 'high_count';
      typeCopy.title   = 'High count';
      typeCopy.mlDebugAgg = {max: 'max', min: 'min'};
      filteredAggTypes.push(typeCopy);

      typeCopy = _.clone(type);
      typeCopy.mlName = 'low_count';
      typeCopy.title   = 'Low count';
      typeCopy.mlDebugAgg = {max: 'max', min: 'min'};
      filteredAggTypes.push(typeCopy);

    } else if (type.name === 'sum') {
      filteredAggTypes.push(type);

      typeCopy = _.clone(type);
      typeCopy.mlName = 'high_sum';
      typeCopy.title   = 'High sum';
      filteredAggTypes.push(typeCopy);

      typeCopy = _.clone(type);
      typeCopy.mlName = 'low_sum';
      typeCopy.title   = 'Low sum';
      filteredAggTypes.push(typeCopy);

    } else if (type.name === 'avg') {
      type.mlName = 'mean';
      filteredAggTypes.push(type);

      typeCopy = _.clone(type);
      typeCopy.mlName = 'high_mean';
      typeCopy.title   = 'High average';
      filteredAggTypes.push(typeCopy);

      typeCopy = _.clone(type);
      typeCopy.mlName = 'low_mean';
      typeCopy.title   = 'Low average';
      filteredAggTypes.push(typeCopy);

    } else if (type.name === 'min') {
      filteredAggTypes.push(type);
    } else if (type.name === 'max') {
      filteredAggTypes.push(type);
    } else if (type.name === 'cardinality') {
      type.mlDebugAgg = {max: 'max', min: 'min'};
      type.mlName = 'distinct_count';

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