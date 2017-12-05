import { connect } from 'react-redux';
import {
  getResponseTimeSeriesOrEmpty,
  getRpmSeriesOrEmpty
} from '../../../shared/charts/TransactionCharts/selectors';
import Charts from '../../../shared/charts/TransactionCharts';
import { getUrlParams } from '../../../../store/urlParams';
import { getCharts, loadCharts } from '../../../../store/charts';

function mapStateToProps(state = {}) {
  const urlParams = getUrlParams(state);
  const { appName, start, end, transactionType } = urlParams;
  const charts = getCharts(state, { appName, start, end, transactionType });

  return {
    urlParams,
    status: charts.status,
    responseTimeSeries: getResponseTimeSeriesOrEmpty({
      start,
      end,
      chartsData: charts.data
    }),
    rpmSeries: getRpmSeriesOrEmpty({
      start,
      end,
      chartsData: charts.data,
      transactionType
    }),
    isEmpty: charts.data.totalHits === 0
  };
}

const mapDispatchToProps = dispatch => ({
  loadCharts: props => {
    const { appName, start, end, transactionType } = props.urlParams;
    const shouldLoad =
      appName && start && end && transactionType && !props.status;

    if (shouldLoad) {
      dispatch(loadCharts({ appName, start, end, transactionType }));
    }
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(Charts);
