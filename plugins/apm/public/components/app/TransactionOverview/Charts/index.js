import { connect } from 'react-redux';
import Charts from './view';
import { getUrlParams } from '../../../../store/urlParams';
import { getCharts, loadCharts, getKey } from '../../../../store/charts';

function mapStateToProps(state = {}) {
  const urlParams = getUrlParams(state);
  const { appName, start, end, transactionType } = urlParams;
  const key = getKey(appName, start, end, transactionType);

  return {
    urlParams,
    charts: getCharts(state, key)
  };
}

const mapDispatchToProps = {
  loadCharts
};

export default connect(mapStateToProps, mapDispatchToProps)(Charts);
