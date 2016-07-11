import React from 'react';
export default class OfflineCell extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <td key={this.props.key}>
        <div className='big offline'>
          N/A
        </div>
      </td>
    );
  }
};
