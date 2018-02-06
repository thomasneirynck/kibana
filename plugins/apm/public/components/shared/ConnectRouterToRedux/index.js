import { connect } from 'react-redux';
import view from './view';
import { updateLocation } from '../../../store/location';

const mapDispatchToProps = {
  updateLocation
};
export default connect(null, mapDispatchToProps)(view);
