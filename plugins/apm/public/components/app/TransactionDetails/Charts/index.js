import { connect } from 'react-redux';
import Charts from '../../../shared/charts/TransactionCharts';
import { getUrlParams } from '../../../../store/urlParams';
import {
  getDetailsCharts,
  loadDetailsCharts
} from '../../../../store/detailsCharts';
import { getKey } from '../../../../store/apiHelpers';

function mapStateToProps(state = {}) {
  return {
    urlParams: getUrlParams(state),
    charts: getDetailsCharts(state)
  };
}

const mapDispatchToProps = dispatch => ({
  loadCharts: props => {
    const {
      serviceName,
      start,
      end,
      transactionType,
      transactionName
    } = props.urlParams;
    const key = getKey({
      serviceName,
      start,
      end,
      transactionType,
      transactionName
    });

    if (key && props.charts.key !== key) {
      dispatch(
        loadDetailsCharts({
          serviceName,
          start,
          end,
          transactionType,
          transactionName
        })
      );
    }
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(Charts);
