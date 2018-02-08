import { connect } from 'react-redux';
import Distribution from './view';
import { getUrlParams } from '../../../../store/urlParams';
import {
  loadErrorDistribution,
  getErrorDistribution
} from '../../../../store/errorDistribution';

function mapStateToProps(state = {}) {
  return {
    urlParams: getUrlParams(state),
    distribution: getErrorDistribution(state)
  };
}

const mapDispatchToProps = {
  loadErrorDistribution
};
export default connect(mapStateToProps, mapDispatchToProps)(Distribution);
