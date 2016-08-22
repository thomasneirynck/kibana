import React from 'react';
import numeral from 'numeral';
import moment from 'moment';
import _ from 'lodash';
import statusIconClass from '../../../lib/status_icon_class';

export default class ClusterRow extends React.Component {

  checkSupported() {
    return this.props.license && (this.props.license.type !== 'basic' || (this.props.isPrimary && this.props.allBasicClusters));
  }

  changeCluster() {
    this.props.changeCluster(this.props.cluster_uuid);
  }

  handleClickIncompatibleLicense() {
    return () => {
      this.props.licenseWarning(
`You can't view the "${this.props.cluster_name}" cluster because the
Basic license is not compatible with multi-cluster monitoring.

Need a license? [Get a license with full functionality](https://www.elastic.co/subscriptions/xpack)
to enjoy multi-cluster monitoring.`
      );
    };
  }

  handleClickInvalidLicense() {
    return () => {
      this.props.licenseWarning(
`You can't view the "${this.props.cluster_name}" cluster because the
license information is invalid.

Need a license? [Get a free Basic license](https://register.elastic.co/xpack_register)
or get a license with [full functionality](https://www.elastic.co/subscriptions/xpack)
to enjoy multi-cluster monitoring.`
      );
    };
  }

  getPrimaryAction() {
    if (this.checkSupported()) {
      return (
        <a className='clusterName' onClick={() => this.changeCluster() }>
          { this.props.cluster_name } &nbsp;
          { this.props.isPrimary ?
            <i className="fa fa-asterisk primary-cluster-indicator" title="Kibana uses this cluster as the primary connection"></i> :
            '' }
        </a>
      );
    }

    // not supported because license is basic/not compatible with multi-cluster
    if (this.props.license) {
      return (
        <a className='clusterName' onClick={this.handleClickIncompatibleLicense()}>{ this.props.cluster_name }</a>
      );
    }

    // not supported because license is invalid
    return (
      <a className='clusterName' onClick={this.handleClickInvalidLicense()}>{ this.props.cluster_name }</a>
    );
  }

  getLicenseInfo() {
    if (this.props.license) {
      const licenseExpiry = (() => {
        if (this.props.license.expiry_date_in_millis < moment().valueOf()) {
          // license is expired
          return <div className="expires expired">Expired</div>;
        }

        // license is fine
        return (
          <div className="expires">
            Expires { moment(this.props.license.expiry_date_in_millis).format('D MMM YY') }
          </div>
        );
      }());

      return (
        <div>
          <div className="license">
            { _.capitalize(this.props.license.type) }
          </div>
          { licenseExpiry }
        </div>
      );
    }

    // there is no license!
    return (
      <div className="license" onClick={this.handleClickInvalidLicense()}>
        N/A
      </div>
    );
  }

  /*
   * helper for avoiding TypeError for nested properties
   */
  path(path) {
    return _.get(this.props, path);
  }

  render() {

    const classes = ['big'];
    const isSupported = this.checkSupported();
    if (!isSupported) {
      classes.push('basic');
    }

    const iconClass = statusIconClass(this.props.status);
    return (
      <tr className={ classes.join(' ') }>
        <td key="Name">
          { this.getPrimaryAction() }
        </td>
        <td key="Status">
          { isSupported ?
            <span className={`status status-${this.props.status}`}>
              <i className={iconClass} title={_.capitalize(this.props.status)}></i>
            </span> : '-' }
        </td>
        <td key="Nodes">
          { isSupported ?
            numeral(this.path('elasticsearch.stats.nodes.count.total')).format('0,0') :
            '-' }
        </td>
        <td key="Indices">{ isSupported ? numeral(this.path('elasticsearch.stats.indices.count')).format('0,0') : '-' }</td>
        <td key="Data">
          { isSupported ?
            numeral(this.path('elasticsearch.stats.indices.store.size_in_bytes')).format('0,0[.]0 b') :
            '-' }
        </td>
        <td key="Kibana">
          { isSupported ?
            numeral(this.path('kibana.count')).format('0,0') :
            '-' }
        </td>
        <td key="License" className="license">
          { this.getLicenseInfo() }
        </td>
      </tr>
    );

  }

}
