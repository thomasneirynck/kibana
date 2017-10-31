import React, { Component } from 'react';
import styled from 'styled-components';
import { get } from 'lodash';
import withErrorHandler from '../../shared/withErrorHandler';
import PageHeader from '../../shared/PageHeader';
import DetailView from './DetailView';
import Distribution from './Distribution';

import { units, px, fontFamilyCode, fontSizes } from '../../../style/variables';

const Titles = styled.div`
  height: ${px(units.triple)};
  margin-bottom: ${px(units.plus)};
`;

const Message = styled.div`
  font-family: ${fontFamilyCode};
  font-weight: bold;
  font-size: ${fontSizes.large};
  margin-bottom: ${px(units.half)};
`;

const Culprit = styled.div`
  font-family: ${fontFamilyCode};
`;

function loadErrorGroup(props) {
  const { appName, errorGroupId, start, end } = props.urlParams;

  if (appName && errorGroupId && start && end && !props.errorGroup.status) {
    props.loadErrorGroup({ appName, errorGroupId, start, end });
  }
}

class ErrorGroupDetails extends Component {
  componentDidMount() {
    loadErrorGroup(this.props);
  }

  componentWillReceiveProps(nextProps) {
    loadErrorGroup(nextProps);
  }

  render() {
    const { errorGroupId } = this.props.urlParams;
    const { errorGroup } = this.props;

    const message = get(errorGroup.data, 'error.error.exception.message');
    const culprit = get(errorGroup.data, 'error.error.culprit');

    return (
      <div>
        <PageHeader
          title={`Error group ${errorGroupId.slice(0, 5) || 'N/A'}`}
        />
        <Titles>
          <Message>{message}</Message>
          <Culprit>{culprit}</Culprit>
        </Titles>
        <Distribution />
        <DetailView errorGroup={errorGroup} urlParams={this.props.urlParams} />
      </div>
    );
  }
}

export default withErrorHandler(ErrorGroupDetails, ['errorGroup']);
