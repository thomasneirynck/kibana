import React, { Component } from 'react';
import styled from 'styled-components';
import { unit, units, px, fontSizes, colors } from '../../../style/variables';
import { RelativeLink } from '../../../utils/url';
import Breadcrumbs from '../../shared/Breadcrumbs';
import withErrorHandler from '../../shared/withErrorHandler';

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

const AppsContainer = styled.div`margin: ${px(unit)} 0 0 0;`;
const AppContainer = styled.div`
  display: flex;
  justify-content: space-between;
  border: 1px solid ${colors.elementBorderDark};
  border-radius: ${units.quarter}px;
  font-size: ${px(unit)};
  padding: ${px(unit)} ${px(units.plus)};
  margin: 0 0 ${px(unit)} 0;
`;

const AppLink = styled(RelativeLink)`
  font-size: ${fontSizes.xlarge};
  line-height: ${px(units.unit * 2.5)};
`;

class AppList extends Component {
  componentDidMount() {
    fetchData(this.props);
  }

  componentWillReceiveProps(nextProps) {
    fetchData(nextProps);
  }

  render() {
    return (
      <div>
        <Breadcrumbs />
        <Header>Apps</Header>
        <AppsContainer>
          {this.props.appList.data.map(app => (
            <AppContainer key={app.appName}>
              <AppLink path={`${app.appName}/transactions`}>
                {app.appName}
              </AppLink>
            </AppContainer>
          ))}
        </AppsContainer>
      </div>
    );
  }
}

export default withErrorHandler(AppList, ['appList']);
