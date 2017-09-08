import { connect } from 'react-redux';
import Breadcrumbs from './view';

function mapStateToProps(state) {
  return {
    location: state.location // Must be passed for the component and router to update correctly. See: https://reacttraining.com/react-router/web/guides/dealing-with-update-blocking
  };
}

const mapDispatchToProps = {};
export default connect(mapStateToProps, mapDispatchToProps)(Breadcrumbs);
