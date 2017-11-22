import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import withErrorHandler from '../../shared/withErrorHandler';
import { STATUS } from '../../../constants';
import { isEmpty } from 'lodash';
import { loadAgentStatus } from '../../../services/rest';
import { RelativeLink } from '../../../utils/url';

import styled from 'styled-components';
import { px, unit, units, colors, fontSizes } from '../../../style/variables';
import { KuiButton } from 'ui_framework/components';
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

const BetaCallout = styled.div`
  padding: ${px(unit)};
  background: ${colors.apmBetaBlue};
  margin: 0 0 ${px(units.double)} 0;
  border-left: solid 2px ${colors.apmBetaDarkBlue};

  strong {
    font-size: ${fontSizes.large};
    color: ${colors.apmBetaDarkBlue};
  }

  p {
    margin: ${px(units.half)} 0;
  }
`;

class AppOverview extends Component {
  state = {
    hideBetaCallout: false
  };

  componentDidMount() {
    fetchData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    fetchData(nextProps);
    redirectIfNoData(nextProps);
  }

  componentWillMount() {
    const hideBetaCallout = localStorage.getItem('xpack.apm.hideBetaCallout');

    if (hideBetaCallout) {
      this.setState({ hideBetaCallout: true });
    }
  }

  dismissCallout = () => {
    this.setState({ hideBetaCallout: true });
    localStorage.setItem('xpack.apm.hideBetaCallout', true);
  };

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

        {this.state.hideBetaCallout === false && (
          <BetaCallout>
            <strong>Welcome to the APM beta!</strong>
            <p>
              We would love your feedback. To get in touch, please follow the
              &quot;Beta feedback&quot; link in the header. Thanks!
            </p>
            <KuiButton buttonType="primary" onClick={this.dismissCallout}>
              Got it
            </KuiButton>
          </BetaCallout>
        )}

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
