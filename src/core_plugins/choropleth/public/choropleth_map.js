import { EventEmitter } from 'events';
import L from 'leaflet';



class ChoroplethMap extends EventEmitter {

  constructor(domNode) {
    super();

    this._leafletMap = L.map(domNode, {});
    this._leafletMap.setView([0, 0], 0);

    L.tileLayer('https://c.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      id: 'mapbox.light'
    }).addTo(this._leafletMap);
  }

  resize() {
    this._leafletMap.invalidateSize();
  }


  setChoroplethLayer() {
  }

  _invalidate() {
  }

}
export default ChoroplethMap;
