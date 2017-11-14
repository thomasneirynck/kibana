import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import withErrorHandler from '../../shared/withErrorHandler';
import { STATUS } from '../../../constants';
import { isEmpty } from 'lodash';
import { loadAgentStatus } from '../../../services/rest';
import { RelativeLink } from '../../../utils/url';

import styled from 'styled-components';
import { KuiButton } from 'ui_framework/components';
import { units, px } from '../../../style/variables';
import List from './List';
import { PageHeader } from '../../shared/UIComponents';

function fetchData(props) {
  const { start, end } = props.urlParams;
  if (start && end && !props.appList.status) {
    props.loadAppList({ start, end });
  }
}

function redirectIfNoData({ appList, history }) {
  if (appList.status === STATUS.SUCCESS && isEmpty(appList.data)) {
    loadAgentStatus().then(result => {
      if (!result.dataFound) {
        history.push({
          pathname: '/getting-started'
        });
      }
    });
  }
}

const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
`;

const GettingStartedLink = styled(RelativeLink)`
  margin-top: ${px(units.minus)};
`;

class AppOverview extends Component {
  componentDidMount() {
    fetchData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    fetchData(nextProps);
    redirectIfNoData(nextProps);
  }

  render() {
    const { appList, changeAppSorting, appSorting } = this.props;

    return (
      <div>
        <HeaderWrapper>
          <PageHeader>Apps</PageHeader>
          <GettingStartedLink path="/getting-started">
            <KuiButton buttonType="secondary">Setup Instructions</KuiButton>
          </GettingStartedLink>
        </HeaderWrapper>

        <List
          items={appList.data}
          changeAppSorting={changeAppSorting}
          appSorting={appSorting}
        />
      </div>
    );
  }
}

export default withErrorHandler(withRouter(AppOverview), ['appList']);
