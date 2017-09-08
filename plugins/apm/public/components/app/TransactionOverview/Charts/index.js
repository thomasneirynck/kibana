import { connect } from 'react-redux';
import Charts from './view';
import { getUrlParams } from '../../../../store/urlParams';
import { getCharts, loadCharts } from '../../../../store/charts';
import { getResponseTimeSeries, getRpmSeries } from './selectors';

function mapStateToProps(state = {}) {
  const urlParams = getUrlParams(state);
  const { appName, start, end, transactionType } = urlParams;
  const charts = getCharts(state, { appName, start, end, transactionType });

  return {
    urlParams,
    status: charts.status,
    responseTimeSeries: getResponseTimeSeries(charts.data.responseTimes),
    rpmSeries: getRpmSeries(charts.data)
  };
}

const mapDispatchToProps = {
  loadCharts
};

export default connect(mapStateToProps, mapDispatchToProps)(Charts);
