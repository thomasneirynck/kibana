import { connect } from 'react-redux';
import AppList from './index';
import { loadAppList, getAppList } from '../../../store/appLists';
import { getUrlParams } from '../../../store/urlParams';

function mapStateToProps(state = {}) {
  return {
    appList: getAppList(state),
    urlParams: getUrlParams(state)
  };
}

const mapDispatchToProps = {
  loadAppList
};
export default connect(mapStateToProps, mapDispatchToProps)(AppList);
