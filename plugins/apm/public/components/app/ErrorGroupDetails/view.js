import React, { Component } from 'react';
import styled from 'styled-components';
import { get } from 'lodash';
import withErrorHandler from '../../shared/withErrorHandler';
import { PageHeader, GraphHeader } from '../../shared/UIComponents';
import DetailView from './DetailView';
import Distribution from './Distribution';

import { units, px, fontFamilyCode, fontSizes } from '../../../style/variables';
import { ERROR_CULPRIT, ERROR_MESSAGE } from '../../../../common/constants';

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

    const message = get(errorGroup.data.error, ERROR_MESSAGE);
    const culprit = get(errorGroup.data.error, ERROR_CULPRIT);

    return (
      <div>
        <PageHeader>Error group {errorGroupId.slice(0, 5) || 'N/A'}</PageHeader>
        <Titles>
          <Message>{message}</Message>
          <Culprit>{culprit}</Culprit>
        </Titles>
        <GraphHeader>Occurrences</GraphHeader>
        <Distribution />
        <DetailView errorGroup={errorGroup} urlParams={this.props.urlParams} />
      </div>
    );
  }
}

export default withErrorHandler(ErrorGroupDetails, ['errorGroup']);
