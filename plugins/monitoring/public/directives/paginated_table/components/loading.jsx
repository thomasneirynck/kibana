var React = require('react');
export default class Loading extends React.Component {
  render() {
    const colSpan = this.props.columns.length;
    return (
      <tbody>
        <tr>
          <td colSpan={ colSpan } className="loading">
            <i className="fa fa-spinner fa-pulse"></i>
            <span>Loading data...</span>
          </td>
        </tr>
      </tbody>
    );
  }
}
