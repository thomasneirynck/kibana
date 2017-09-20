import { connect } from 'react-redux';
import AppOverview from './view';
import { loadAppList, getAppList } from '../../../store/appLists';
import { getUrlParams } from '../../../store/urlParams';
import sorting, { changeAppSorting } from '../../../store/sorting';

function mapStateToProps(state = {}) {
  return {
    appList: getAppList(state),
    urlParams: getUrlParams(state),
    appSorting: sorting(state, 'app').sorting.app
  };
}

const mapDispatchToProps = {
  loadAppList,
  changeAppSorting
};
export default connect(mapStateToProps, mapDispatchToProps)(AppOverview);
