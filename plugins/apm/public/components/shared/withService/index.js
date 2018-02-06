import { connect } from 'react-redux';
import { getUrlParams } from '../../../store/urlParams';
import { loadService, getService } from '../../../store/services';
import getComponentWithService from './view';
import { getDisplayName } from '../HOCUtils';

function withService(WrappedComponent) {
  function mapStateToProps(state = {}, props) {
    return {
      service: getService(state),
      urlParams: getUrlParams(state),
      originalProps: props
    };
  }

  const mapDispatchToProps = {
    loadService
  };

  const HOC = getComponentWithService(WrappedComponent);
  HOC.displayName = `WithService(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps, mapDispatchToProps)(HOC);
}

export default withService;
