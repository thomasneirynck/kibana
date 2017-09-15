import { connect } from 'react-redux';
import ErrorGroupOverview from './view';
import { getUrlParams } from '../../../store/urlParams';
import {
  getErrorGroupList,
  loadErrorGroupList
} from '../../../store/errorGroupLists';
import { changeErrorGroupSorting } from '../../../store/errorGroupSorting';

function mapStateToProps(state = {}) {
  return {
    urlParams: getUrlParams(state),
    errorGroupList: getErrorGroupList(state),
    errorGroupSorting: state.errorGroupSorting
  };
}

const mapDispatchToProps = {
  loadErrorGroupList,
  changeErrorGroupSorting
};

export default connect(mapStateToProps, mapDispatchToProps)(ErrorGroupOverview);
