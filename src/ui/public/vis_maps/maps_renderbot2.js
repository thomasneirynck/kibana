import _ from 'lodash';
import MapsProvider from 'ui/vis_maps/maps';//todo: remove include
import VisRenderbotProvider from 'ui/vis/renderbot';
import MapsVisTypeBuildChartDataProvider from 'ui/vislib_vis_type/build_chart_data';
// import FilterBarPushFilterProvider from 'ui/filter_bar/push_filter';
import FilterBarPushFilterProvider from 'ui/filter_bar/put_filter';
import KibanaMap from './kibana_map';
import $ from 'jquery';

module.exports = function MapsRenderbotFactory(Private, $injector, tilemapSettings, Notifier, courier, getAppState) {

  const Renderbot = Private(VisRenderbotProvider);
  const buildChartData = Private(MapsVisTypeBuildChartDataProvider);
  const notify = new Notifier({
    location: 'Tilemap'
  });


  let filterID = 0;
  class MapsRenderbot extends Renderbot {

    constructor(vis, $el, uiState) {
      super(vis, $el, uiState);

      this._buildChartData = buildChartData.bind(this);//todo: buildChartData shouldn't be a mixin. too confusing.


      if (tilemapSettings.getError()) {
        //Still allow the visualization to be build, but show a toast that there was a problem retrieving map settings
        //Even though the basemap will not display, the user will at least still see the overlay data
        notify.warning(tilemapSettings.getError().message);
      }
      const containerElement = $($el)[0];

      this._kibanaMap = new KibanaMap(containerElement);
      this._kibanaMap.on('moveend', _ => this._persistUIStateFromMap());
      this._kibanaMap.on('zoomend', _ => {
          this._persistUIStateFromMap();
          console.log('todo! this needs to be toggleable with autoPrecision params');
          courier.fetch();
        }
      );


      this._drawFilterId = 'drawFilterId' + (filterID++);
      this._kibanaMap.on('drawCreated:rectangle', event => {
        addSpatialFilter(_.get(this.mapsData, 'geohashGridAgg'), 'geo_bounding_box', event.bounds, this._drawFilterId);
      });

      this._kibanaMap.on('drawCreated:polygon', event => {
        addSpatialFilter(_.get(this.mapsData, 'geohashGridAgg'), 'geo_polygon', {points: event.points}, this._drawFilterId);
      });


      this._configureGeoHashLayer();
      this._useUIState();
    }

    render(esResponse) {
      console.log('render, esResponse', esResponse);
      this.mapsData = this._buildChartData(esResponse);
      const params = this._getMapsParams();
      this.mapsParams = params;

      this._kibanaMap.setGeohashFeatureCollection(this.mapsData.geoJson);
      this._useUIState();
      this._kibanaMap.resize();
    }

    destroy() {
      const mapsVis = this.mapsVis;
      _.forOwn(this.vis.listeners, function (listener, event) {
        mapsVis.off(event, listener);
      });
      mapsVis.destroy();
    }

    updateParams() {

      const newParams = this._getMapsParams();
      this._configureGeoHashLayer();

      if (newParams.wms.enabled) {
        this._kibanaMap.setWMSBaseLayer({
          options: newParams.wms.options,
          url: newParams.wms.url
        });
      } else {
        const url = tilemapSettings.getUrl();
        const options = tilemapSettings.getTMSOptions();
        this._kibanaMap.setTMSBaseLayer({url, ...options});
      }

      this._useUIState();

    }


    _useUIState() {
      const uiState = this.vis.getUiState();
      const newParams = this._getMapsParams();

      const zoomFromUiState = parseInt(uiState.get('mapZoom'));
      const centerFromUIState = uiState.get('mapCenter');
      if (!isNaN(zoomFromUiState)) {
        this._kibanaMap.setZoomLevel(zoomFromUiState);
      } else {// this._kibanaMap.setCenter(newParams.mapCenter[0], newParams.mapCenter[1]);
        this._kibanaMap.setZoomLevel(newParams.mapZoom);
      }
      if (centerFromUIState) {
        this._kibanaMap.setCenter(centerFromUIState[0], centerFromUIState[1]);
      } else {
        this._kibanaMap.setCenter(newParams.mapCenter[0], newParams.mapCenter[1]);
      }
    }

    _persistUIStateFromMap() {

      const uiState = this.vis.getUiState();
      const zoomFromUIState = parseInt(uiState.get('mapZoom'));
      const centerFromUIState = uiState.get('mapCenter');
      if (isNaN(zoomFromUIState) || this._kibanaMap.getZoomLevel() !== zoomFromUIState) {
        uiState.set('mapZoom', this._kibanaMap.getZoomLevel());
      }

      const centerFromMap = this._kibanaMap.getCenter();
      if (!centerFromUIState || centerFromMap.lon !== centerFromUIState[1] || centerFromMap.lat !== centerFromUIState[0]) {
        uiState.set('mapCenter', [centerFromMap.lat, centerFromMap.lon]);
      }
    }

    _getMapsParams() {
      return _.assign({}, this.vis.type.params.defaults, {
          type: this.vis.type.name,
          // Add attribute which determines whether an index is time based or not.
          hasTimeField: this.vis.indexPattern && this.vis.indexPattern.hasTimeField()
        },
        this.vis.params
      );
    }


    _configureGeoHashLayer() {
      const newParams = this._getMapsParams();
      this._kibanaMap.setGeohashLayerOptions({
        mapType: newParams.mapType,
        heatmap: {
          heatBlur: newParams.heatBlur,
          heatMaxZoom: newParams.heatMaxZoom,
          heatMinOpacity: newParams.heatMinOpacity,
          heatNormalizeData: newParams.heatNormalizeData,
          heatRadius: newParams.heatRadius
        }
      });
    }
  }


  function addSpatialFilter(agg, filterName, filterData, filterId) {
    if (!agg) {
      return;
    }
    const pushFilter = Private(FilterBarPushFilterProvider)(getAppState());
    const indexPatternName = agg.vis.indexPattern.id;
    const field = agg.fieldName();
    const filter = {};
    filter[filterName] = {};
    filter[filterName][field] = filterData;
    const id = pushFilter(filter, false, indexPatternName, filterId);
    console.log('what did I get(?)');
    return id;
  }


  return MapsRenderbot;
};


