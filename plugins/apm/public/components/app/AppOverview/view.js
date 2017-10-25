import React, { Component } from 'react';
import withErrorHandler from '../../shared/withErrorHandler';
import List from './List';

import styled from 'styled-components';
import { units, px, fontSizes } from '../../../style/variables';

function fetchData(props) {
  const { start, end } = props.urlParams;
  if (start && end && !props.appList.status) {
    props.loadAppList({ start, end });
  }
}

const Header = styled.h1`
  margin: ${px(units.plus)} 0 ${px(units.plus)} 0;
  font-size: ${fontSizes.xxlarge};
`;

class AppOverview extends Component {
  componentDidMount() {
    fetchData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    fetchData(nextProps);
  }

  render() {
    const { appList, changeAppSorting, appSorting } = this.props;

    return (
      <div>
        <Header>Apps</Header>

        <List
          items={appList.data}
          changeAppSorting={changeAppSorting}
          appSorting={appSorting}
        />
      </div>
    );
  }
}

export default withErrorHandler(AppOverview, ['appList']);
