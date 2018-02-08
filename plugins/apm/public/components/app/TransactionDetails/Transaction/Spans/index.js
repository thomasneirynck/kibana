import { connect } from 'react-redux';
import Spans from './view';
import { getUrlParams } from '../../../../../store/urlParams';
import { loadSpans, getSpans } from '../../../../../store/spans';

function mapStateToProps(state = {}) {
  return {
    urlParams: getUrlParams(state),
    spans: getSpans(state),
    location: state.location
  };
}

const mapDispatchToProps = {
  loadSpans
};
export default connect(mapStateToProps, mapDispatchToProps)(Spans);
