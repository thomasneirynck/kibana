import React, { Component } from 'react';
import styled from 'styled-components';
import { get } from 'lodash';
import withErrorHandler from '../../shared/withErrorHandler';
import { PageHeader } from '../../shared/UIComponents';
import DetailView from './DetailView';
import Distribution from './Distribution';

import { units, px, fontFamilyCode, fontSizes } from '../../../style/variables';
import {
  ERROR_CULPRIT,
  ERROR_LOG_MESSAGE,
  ERROR_EXC_MESSAGE
} from '../../../../common/constants';

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
  const { serviceName, errorGroupId, start, end } = props.urlParams;

  if (serviceName && errorGroupId && start && end && !props.errorGroup.status) {
    props.loadErrorGroup({ serviceName, errorGroupId, start, end });
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

    // If there are 0 occurrences, show only distribution chart w. empty message
    const showDetails = errorGroup.data.occurrencesCount !== 0;

    const message =
      get(errorGroup.data.error, ERROR_LOG_MESSAGE) ||
      get(errorGroup.data.error, ERROR_EXC_MESSAGE);
    const culprit = get(errorGroup.data.error, ERROR_CULPRIT);

    return (
      <div>
        <PageHeader>Error group {errorGroupId.slice(0, 5) || 'N/A'}</PageHeader>
        {showDetails && (
          <Titles>
            <Message>{message || 'N/A'}</Message>
            <Culprit>{culprit || 'N/A'}</Culprit>
          </Titles>
        )}
        <Distribution />
        {showDetails && (
          <DetailView
            errorGroup={errorGroup}
            urlParams={this.props.urlParams}
          />
        )}
      </div>
    );
  }
}

export default withErrorHandler(ErrorGroupDetails, ['errorGroup']);
