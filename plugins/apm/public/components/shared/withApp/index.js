import { connect } from 'react-redux';
import { getUrlParams } from '../../../store/urlParams';
import { loadApp, getApp } from '../../../store/apps';
import getComponentWithApp from './view';
import { getDisplayName } from '../HOCUtils';

function withApp(WrappedComponent) {
  function mapStateToProps(state = {}, props) {
    return {
      app: getApp(state),
      urlParams: getUrlParams(state),
      originalProps: props
    };
  }

  const mapDispatchToProps = {
    loadApp
  };

  const HOC = getComponentWithApp(WrappedComponent);
  HOC.displayName = `WithApp(${getDisplayName(WrappedComponent)})`;

  return connect(mapStateToProps, mapDispatchToProps)(HOC);
}

export default withApp;
