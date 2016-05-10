var React = require('react');
var numeral = require('numeral');
var moment = require('moment');
var _ = require('lodash');

class ClusterRow extends React.Component {

  changeCluster() {
    if (this.props.license.type === 'basic') return;
    this.props.changeCluster(this.props.cluster_uuid);
  }

  render() {

    var self = this;
    function get(path) {
      return _.get(self.props, path);
    }

    var licenseExpiry = (
      <div className="expires">
        Expires { moment(get('license.expiry_date_in_millis')).format('D MMM YY') }
      </div>
    );

    if (get('license.expiry_date_in_millis') < moment().valueOf()) {
      licenseExpiry = (<div className="expires expired">Expired</div>);
    }

    var classes = [];
    var notBasic = true;
    if (get('license.type') === 'basic') {
      classes.push('basic');
      notBasic = false;
    }

    return (
      <tr className={ classes.join(' ') }>
        <td key="Name"><a onClick={(event) => this.changeCluster(event) }>{ get('cluster_name') }</a></td>
        <td key="Nodes">{ notBasic ? numeral(get('stats.nodes.count.total')).format('0,0') : '-' }</td>
        <td key="Indices">{ notBasic ? numeral(get('stats.indices.count')).format('0,0') : '-' }</td>
        <td key="Data">{ notBasic ? numeral(get('stats.indices.store.size_in_bytes')).format('0,0[.]0 b') : '-' }</td>
        <td key="Kibana">{ notBasic ? numeral(get('kibana.count')).format('0,0') : '-' }</td>
        <td key="License" className="license">
          <div className="license">{ _.capitalize(get('license.type')) }</div>
          { licenseExpiry }
        </td>
      </tr>
    );
  }

}
module.exports = ClusterRow;
