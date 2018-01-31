import React from 'react';
import { Switch, Route } from 'react-router-dom';
import { BASE_PATH } from '../common/constants';
import { IndexList } from './sections/index_list';

export const App = () => (
  <div>
    <Switch>
      <Route path={BASE_PATH} component={IndexList} />
    </Switch>
  </div>
);
