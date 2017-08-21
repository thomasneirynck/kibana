import { connect } from 'react-redux';
import Distribution from './view';
import { getUrlParams } from '../../../../store/urlParams';
import {
  loadDistribution,
  getDistribution
} from '../../../../store/distributions';

function mapStateToProps(state = {}) {
  return {
    urlParams: getUrlParams(state),
    distribution: getDistribution(state)
  };
}

const mapDispatchToProps = {
  loadDistribution
};
export default connect(mapStateToProps, mapDispatchToProps)(Distribution);
