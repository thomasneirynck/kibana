import React, { Component } from 'react';
import styled from 'styled-components';
import { get } from 'lodash';
import withErrorHandler from '../../shared/withErrorHandler';
import { PageHeader } from '../../shared/UIComponents';
import DetailView from './DetailView';
import Distribution from './Distribution';

import { EuiText } from '@elastic/eui';
import {
  unit,
  units,
  px,
  colors,
  fontFamilyCode,
  fontSizes
} from '../../../style/variables';
import {
  ERROR_CULPRIT,
  ERROR_LOG_MESSAGE,
  ERROR_EXC_MESSAGE
} from '../../../../common/constants';

const Titles = styled.div`
  height: ${px(unit * 10)};
  margin-bottom: ${px(units.plus)};
`;

const Label = styled.div`
  margin-bottom: ${px(units.quarter)};
  font-size: ${fontSizes.small};
  color: ${colors.gray3};
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

    const logMessage = get(errorGroup.data.error, ERROR_LOG_MESSAGE);
    const excMessage = get(errorGroup.data.error, ERROR_EXC_MESSAGE);

    const culprit = get(errorGroup.data.error, ERROR_CULPRIT);

    return (
      <div>
        <PageHeader>Error group {errorGroupId.slice(0, 5) || 'N/A'}</PageHeader>
        {showDetails && (
          <Titles>
            <EuiText>
              <Label>Log message</Label>
              <Message>{logMessage || 'N/A'}</Message>
              <Label>Exception message</Label>
              <Message>{excMessage || 'N/A'}</Message>
              <Label>Culprit</Label>
              <Culprit>{culprit || 'N/A'}</Culprit>
            </EuiText>
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
