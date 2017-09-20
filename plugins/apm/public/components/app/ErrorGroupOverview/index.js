import { connect } from 'react-redux';
import ErrorGroupOverview from './view';
import { getUrlParams } from '../../../store/urlParams';
import {
  getErrorGroupList,
  loadErrorGroupList
} from '../../../store/errorGroupLists';
import sorting, { changeErrorGroupSorting } from '../../../store/sorting';

function mapStateToProps(state = {}) {
  return {
    urlParams: getUrlParams(state),
    errorGroupList: getErrorGroupList(state),
    errorGroupSorting: sorting(state, 'errorGroup').sorting.errorGroup
  };
}

const mapDispatchToProps = {
  loadErrorGroupList,
  changeErrorGroupSorting
};

export default connect(mapStateToProps, mapDispatchToProps)(ErrorGroupOverview);
