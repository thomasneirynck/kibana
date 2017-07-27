import React from 'react';
import { KuiEmptyTablePrompt } from 'ui_framework/components';
import { DEFAULT_NO_DATA_MESSAGE } from '../../../common/constants';

export class NoData extends React.Component {
  render() {
    const colSpan = this.props.columns.length;
    const message = this.props.message || DEFAULT_NO_DATA_MESSAGE;
    return (
      <tbody>
        <tr>
          <td colSpan={ colSpan }>
            <KuiEmptyTablePrompt message={ message } />
          </td>
        </tr>
      </tbody>
    );
  }
}
