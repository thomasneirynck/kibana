import { connect } from 'react-redux';
import Traces from './index';
import { getUrlParams } from '../../../../../store/urlParams';
import { loadTraces, getTraces } from '../../../../../store/traces';

function mapStateToProps(state = {}) {
  return {
    urlParams: getUrlParams(state),
    traces: getTraces(state)
  };
}

const mapDispatchToProps = {
  loadTraces
};
export default connect(mapStateToProps, mapDispatchToProps)(Traces);
