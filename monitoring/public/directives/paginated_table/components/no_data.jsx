var React = require('react');
class Loading extends React.Component {
  render() {
    const colSpan = this.props.columns.length;
    return (
      <tbody>
        <tr>
          <td colSpan={ colSpan } className="loading">
            <span>There are no records that match your query. Try changing the time range selection.</span>
          </td>
        </tr>
      </tbody>
      );
  }
}
module.exports = Loading;
