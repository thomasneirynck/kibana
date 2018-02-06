import { connect } from 'react-redux';
import LicenseChecker from './view';
import { loadLicense } from '../../../../store/license';

function mapStateToProps(state = {}) {
  return {
    license: state.license
  };
}

const mapDispatchToProps = {
  loadLicense
};
export default connect(mapStateToProps, mapDispatchToProps)(LicenseChecker);
