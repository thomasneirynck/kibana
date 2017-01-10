import uiModules from 'ui/modules';
import ChoroplethMap from './choropleth_map';
import _ from 'lodash';

const module = uiModules.get('kibana/choropleth', ['kibana']);
module.controller('KbnChoroplethController', function ($scope, $element, Private, getAppState) {

  const containerNode = $element[0];
  const choroplethMap = new ChoroplethMap(containerNode);

  $scope.$watch('esResponse', async function (response) {

    const termAggId = _.first(_.pluck($scope.vis.aggs.bySchemaName.segment, 'id'));
    if (!response) {
      return;
    }


    const metricsAgg = _.first($scope.vis.aggs.bySchemaName.metric);
    const buckets = response.aggregations[termAggId].buckets;

    const results = buckets.map((bucket) => {
      return {
        term: bucket.key,
        value: getValue(metricsAgg, bucket)
      };
    });

    const style = makeStyleFunction(results);
    choroplethMap.setStyle(style);
    choroplethMap.resize();

  });

  $scope.$watch('vis.params', (options) => {
    choroplethMap.resize();
  });


});


function makeStyleFunction(data) {

  let min = data[0].value;
  let max = data[0].value;
  for (let i = 1; i < data.length; i += 1) {
    min = Math.min(data[i].value, min);
    max = Math.max(data[i].value, max);
  }

  return function (geojsonFeature) {

    const match = data.find(function (bucket) {
      return bucket.term === geojsonFeature.properties.iso;
    });

    if (!match) {
      return {
        fillColor: 'rgb(255,255,255)',
        weight: 2,
        opacity: 1,
        color: 'white',
        dashArray: '3',
        fillOpacity: 0
      }
    }

    return {
      fillColor: getColor(match.value, min, max),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  }

}

const ramp = ['#FFEDA0', '#FED976', '#FEB24C', '#FD8D3C', '#FC4E2A', '#E31A1C', '#BD0026', '#800026'];
function getColor(value, min, max) {
  const fraction = (value - min) / (max - min);
  const index = Math.round(ramp.length * fraction) - 1;
  let i = Math.max(Math.min(ramp.length - 1, index), 0);
  return ramp[i];
}


function getValue(metricsAgg, bucket) {
  let size = metricsAgg.getValue(bucket);
  if (typeof size !== 'number' || isNaN(size)) {
    try {
      size = bucket[1].values[0].value;//lift out first value (e.g. median aggregations return as array)
    } catch (e) {
      size = 1;//punt
    }
  }
  return size;
}

