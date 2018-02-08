import { connect } from 'react-redux';
import ErrorGroupDetails from './view';
import { getUrlParams } from '../../../store/urlParams';
import { getErrorGroup, loadErrorGroup } from '../../../store/errorGroup';

function mapStateToProps(state = {}) {
  return {
    urlParams: getUrlParams(state),
    errorGroup: getErrorGroup(state),
    location: state.location
  };
}

const mapDispatchToProps = {
  loadErrorGroup
};

export default connect(mapStateToProps, mapDispatchToProps)(ErrorGroupDetails);
