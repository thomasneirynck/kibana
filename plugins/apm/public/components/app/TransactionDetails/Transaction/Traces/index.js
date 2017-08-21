import { connect } from 'react-redux';
import Traces from './view';
import { getUrlParams } from '../../../../../store/urlParams';
import {
  loadTraces,
  getTraces,
  getTracesNext
} from '../../../../../store/traces';

function mapStateToProps(state = {}) {
  return {
    urlParams: getUrlParams(state),
    tracesNext: getTracesNext(state),
    traces: getTraces(state)
  };
}

const mapDispatchToProps = {
  loadTraces
};
export default connect(mapStateToProps, mapDispatchToProps)(Traces);
