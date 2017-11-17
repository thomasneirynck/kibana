import { connect } from 'react-redux';
import {
  getResponseTimeSeries,
  getRpmSeries
} from '../../../shared/charts/TransactionCharts/selectors';
import Charts from '../../../shared/charts/TransactionCharts';
import { getUrlParams } from '../../../../store/urlParams';
import { getCharts, loadCharts } from '../../../../store/charts';

function mapStateToProps(state = {}) {
  const urlParams = getUrlParams(state);
  const { appName, start, end, transactionType, transactionName } = urlParams;
  const charts = getCharts(state, {
    appName,
    start,
    end,
    transactionType,
    transactionName
  });

  return {
    urlParams,
    status: charts.status,
    responseTimeSeries: getResponseTimeSeries({
      start,
      end,
      chartsData: charts.data
    }),
    rpmSeries: getRpmSeries({
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
    const {
      appName,
      start,
      end,
      transactionType,
      transactionName
    } = props.urlParams;
    const shouldLoad =
      appName &&
      start &&
      end &&
      transactionType &&
      transactionName &&
      !props.status;

    if (shouldLoad) {
      dispatch(
        loadCharts({ appName, start, end, transactionType, transactionName })
      );
    }
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(Charts);
