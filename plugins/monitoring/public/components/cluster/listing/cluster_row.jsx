import React from 'react';
import numeral from 'numeral';
import moment from 'moment';
import { capitalize, get } from 'lodash';
import Tooltip from 'plugins/monitoring/components/tooltip';
import { AlertsIndicator } from './alerts_indicator';

function isClusterSupportedFactory(isSupported) {
  return class IsClusterSupported extends React.Component {
    render() {
      if (isSupported) {
        return <span>{this.props.children}</span>;
      } else {
        return <span>-</span>;
      }
    }
  };
}

function PrimaryClusterTooltip({ isPrimary }) {
  if (isPrimary) {
    return (
      <Tooltip text='Kibana uses this cluster as the primary connection' placement='bottom' trigger='hover'>
        <span className='kuiIcon fa-asterisk primary-cluster-indicator'></span>
      </Tooltip>
    );
  }
  return null;
}

export default class ClusterRow extends React.Component {

  checkSupported() {
    return this.props.license && (this.props.license.type !== 'basic' || (this.props.isPrimary && this.props.allBasicClusters));
  }

  changeCluster() {
    return () => this.props.changeCluster(this.props.cluster_uuid);
  }

  handleClickIncompatibleLicense() {
    return () => {
      this.props.licenseWarning(
`You can't view the "${this.props.cluster_name}" cluster because the
Basic license does not support multi-cluster monitoring.

Need to monitor multiple clusters? [Get a license with full functionality](https://www.elastic.co/subscriptions/xpack)
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

  getClusterAction() {
    if (this.checkSupported()) {
      return (
        <span>
          <a className='clusterName link' onClick={this.changeCluster()}>
            { this.props.cluster_name } &nbsp;
            <PrimaryClusterTooltip isPrimary={this.props.isPrimary} />
          </a>
        </span>
      );
    }

    // not supported because license is basic/not compatible with multi-cluster
    if (this.props.license) {
      return (
        <a className='clusterName link' onClick={this.handleClickIncompatibleLicense()}>{ this.props.cluster_name }</a>
      );
    }

    // not supported because license is invalid
    return (
      <a className='clusterName link' onClick={this.handleClickInvalidLicense()}>{ this.props.cluster_name }</a>
    );
  }

  getLicenseInfo() {
    if (this.props.license) {
      const licenseExpiry = () => {
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
      };

      return (
        <div>
          <div className="license">
            { capitalize(this.props.license.type) }
          </div>
          { this.props.showLicenseExpiration ? licenseExpiry() : null }
        </div>
      );
    }

    // there is no license!
    return (
      <div className='license link' onClick={this.handleClickInvalidLicense()}>
        N/A
      </div>
    );
  }

  /*
   * helper for avoiding TypeError for nested properties
   */
  path(path) {
    return get(this.props, path);
  }

  render() {

    const classes = ['big'];
    const isSupported = this.checkSupported();
    const IsClusterSupported = isClusterSupportedFactory(isSupported);

    if (!isSupported) {
      classes.push('basic');
    }

    return (
      <tr className={ classes.join(' ') }>
        <td>
          { this.getClusterAction() }
        </td>
        <td>
          <IsClusterSupported>
            <AlertsIndicator alerts={this.props.alerts} />
          </IsClusterSupported>
        </td>
        <td>
          <IsClusterSupported>
            {numeral(this.path('elasticsearch.stats.nodes.count.total')).format('0,0')}
          </IsClusterSupported>
        </td>
        <td>
          <IsClusterSupported>
            {numeral(this.path('elasticsearch.stats.indices.count')).format('0,0')}
          </IsClusterSupported>
        </td>
        <td>
          <IsClusterSupported>
            {numeral(this.path('elasticsearch.stats.indices.store.size_in_bytes')).format('0,0[.]0 b')}
          </IsClusterSupported>
        </td>
        <td>
          <IsClusterSupported>
            {numeral(this.path('logstash.count')).format('0,0')}
          </IsClusterSupported>
        </td>
        <td>
          <IsClusterSupported>
            {numeral(this.path('kibana.count')).format('0,0')}
          </IsClusterSupported>
        </td>
        <td key="License" className="license">
          { this.getLicenseInfo() }
        </td>
      </tr>
    );

  }

}
