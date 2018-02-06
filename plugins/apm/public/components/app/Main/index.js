import React from 'react';
import styled from 'styled-components';
import { Route, Switch } from 'react-router-dom';
import { routes } from './routeConfig';
import LicenseChecker from './LicenseChecker';
import ScrollToTopOnPathChange from './ScrollToTopOnPathChange';
import { px, units, unit } from '../../../style/variables';
import ConnectRouterToRedux from '../../shared/ConnectRouterToRedux';

const MainContainer = styled.div`
  min-width: ${px(unit * 50)};
  padding: ${px(units.plus)};
`;

export default function Main() {
  return (
    <MainContainer>
      <LicenseChecker />
      <Route component={ConnectRouterToRedux} />
      <Route component={ScrollToTopOnPathChange} />
      {routes.map((route, i) => {
        return route.switch ? (
          <Switch key={i}>
            {route.routes.map((route, i) => <Route key={i} {...route} />)}
          </Switch>
        ) : (
          <Route key={i} {...route} />
        );
      })}
    </MainContainer>
  );
}
