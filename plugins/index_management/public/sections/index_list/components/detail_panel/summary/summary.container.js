import { connect } from 'react-redux';
import { Summary as PresentationComponent } from './summary';


import {
  getIndexByIndexName,
  getDetailPanelIndexName,
} from '../../../../../store/selectors';

const mapStateToProps = (state) => {
  const indexName = getDetailPanelIndexName(state);
  return {
    indexName,
    index: getIndexByIndexName(state, indexName)
  };
};


export const Summary = connect(mapStateToProps)(PresentationComponent);

