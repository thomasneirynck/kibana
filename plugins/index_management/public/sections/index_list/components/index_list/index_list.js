import React from 'react';

import {
  DetailPanel,
  IndexTable,
} from '../../components';
import {
  REFRESH_RATE_INDEX_LIST
} from '../../../../constants';

export class IndexList extends React.PureComponent {
  componentWillMount() {
    this.props.loadIndices();
  }

  componentDidMount() {
    this.interval = setInterval(this.props.reloadIndices, REFRESH_RATE_INDEX_LIST);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    return (
      <div className="indexTableHorizontalScroll im-snapshotTestSubject">
        <IndexTable />
        <DetailPanel />
      </div>
    );
  }
}
