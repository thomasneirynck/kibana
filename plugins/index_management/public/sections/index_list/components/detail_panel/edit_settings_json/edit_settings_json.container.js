import { connect } from 'react-redux';
import { EditSettingsJson as PresentationComponent } from './edit_settings_json';
import {
  closeDetailPanel,
  loadIndexData,
  updateIndexSettings
} from '../../../../../store/actions';
import {
  getDetailPanelData,
  getDetailPanelError,
  getDetailPanelIndexName,
  getIndexStatusByIndexName
} from '../../../../../store/selectors';

const mapStateToProps = (state) => {
  const indexName = getDetailPanelIndexName(state);
  return {
    error: getDetailPanelError(state),
    data: getDetailPanelData(state),
    indexName,
    indexStatus: getIndexStatusByIndexName(state, indexName)
  };
};

const mapDispatchToProps = {
  loadIndexData,
  closeDetailPanel,
  updateIndexSettings
};

export const EditSettingsJson = connect(mapStateToProps, mapDispatchToProps)(PresentationComponent);
