import { connect } from "react-redux";
import { ShowJson as PresentationComponent } from "./show_json";
import { loadIndexData, closeDetailPanel } from "../../../../../store/actions";

import {
  getDetailPanelData,
  getDetailPanelError,
  getDetailPanelIndexName,
  getDetailPanelType,
  getIndexStatusByIndexName
} from "../../../../../store/selectors";

const mapStateToProps = state => {
  const indexName = getDetailPanelIndexName(state);
  return {
    error: getDetailPanelError(state),
    data: getDetailPanelData(state),
    dataType: getDetailPanelType(state),
    indexName,
    indexStatus: getIndexStatusByIndexName(state, indexName)
  };
};

const mapDispatchToProps = {
  loadIndexData,
  closeDetailPanel
};

export const ShowJson = connect(mapStateToProps, mapDispatchToProps)(
  PresentationComponent
);
