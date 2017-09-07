import { connect } from 'react-redux';
import Charts from './view';
import { getUrlParams } from '../../../../store/urlParams';
import { getCharts, loadCharts } from '../../../../store/charts';

function mapStateToProps(state = {}) {
  const urlParams = getUrlParams(state);
  const { appName, start, end, transactionType } = urlParams;

  return {
    urlParams,
    charts: getCharts(state, { appName, start, end, transactionType })
  };
}

const mapDispatchToProps = {
  loadCharts
};

export default connect(mapStateToProps, mapDispatchToProps)(Charts);
