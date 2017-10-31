import React, { Component } from 'react';
import styled from 'styled-components';
import { get } from 'lodash';
import { units, px } from '../../../style/variables';

const MainContainer = styled.div`
  padding: ${px(units.plus)};
`;
function fetchLicense(props) {
  if (!props.license.status) {
    props.loadLicense();
  }
}

class Main extends Component {
  componentDidMount() {
    fetchLicense(this.props);
  }

  componentWillReceiveProps(nextProps) {
    fetchLicense(nextProps);
  }

  render() {
    const isActive = get(this.props, 'license.data.isActive');
    return (
      <MainContainer>
        {isActive ? this.props.children : 'No active license was found'}
      </MainContainer>
    );
  }
}

export default Main;
