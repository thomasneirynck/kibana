import { Component } from 'react';
import { STATUS } from '../../../../constants/index';

function maybeLoadLicense(props) {
  if (!props.license.status) {
    props.loadLicense();
  }
}

class LicenseChecker extends Component {
  componentDidMount() {
    maybeLoadLicense(this.props);
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.license.status === STATUS.SUCCESS &&
      !nextProps.license.data.license.isActive
    ) {
      window.location = '#/invalid-license';
    }

    maybeLoadLicense(nextProps);
  }

  render() {
    return null;
  }
}

export default LicenseChecker;
