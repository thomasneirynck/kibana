// Initially inspired from react-router's ConnectedRouter
// https://github.com/ReactTraining/react-router/blob/master/packages/react-router-redux/modules/ConnectedRouter.js
// Instead of adding a listener to `history` we passively receive props from react-router

// This ensures that we don't have two history listeners (one here, and one for react-router) which can cause "race-condition" type issues
// since history.listen is sync and can result in cascading updates

import { Component } from 'react';
import PropTypes from 'prop-types';

class ConnectRouterToRedux extends Component {
  static propTypes = {
    location: PropTypes.object.isRequired
  };

  componentDidMount() {
    this.props.updateLocation(this.props.location);
  }

  componentWillReceiveProps(nextProps) {
    this.props.updateLocation(nextProps.location);
  }

  render() {
    return null;
  }
}

export default ConnectRouterToRedux;
