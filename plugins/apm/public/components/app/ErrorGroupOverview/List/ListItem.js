import React from 'react';
import styled from 'styled-components';
import {
  unit,
  px,
  colors,
  fontFamilyCode,
  fontSizes
} from '../../../../style/variables';
import { RelativeLink } from '../../../../utils/url';
import { KuiTableRow, KuiTableRowCell } from 'ui_framework/components';
import { RIGHT_ALIGNMENT } from 'ui_framework/services';
import numeral from 'numeral';
import moment from 'moment';

const GroupIdCell = styled(KuiTableRowCell)`width: ${px(unit * 6)};`;

const GroupIdLink = styled(RelativeLink)`
  font-family: ${fontFamilyCode};
  color: ${colors.gray2};
`;

const MessageAndCulpritCell = styled(KuiTableRowCell)`max-width: none;`;

const MessageLink = styled(RelativeLink)`
  display: block;
  font-family: ${fontFamilyCode};
  font-weight: bold;
  font-size: ${fontSizes.large};
`;

const Culprit = styled.div`font-family: ${fontFamilyCode};`;

const OccurrenceCell = styled(KuiTableRowCell)`width: ${px(unit * 14)};`;

function ListItem({ error, appName }) {
  const {
    groupId,
    culprit,
    message,
    occurrenceCount,
    latestOccurrenceAt
  } = error;

  const count = occurrenceCount
    ? numeral(occurrenceCount).format('0.[0]a')
    : 'N/A';
  const timestamp = latestOccurrenceAt
    ? moment(latestOccurrenceAt).fromNow()
    : 'N/A';

  return (
    <KuiTableRow>
      <GroupIdCell>
        <GroupIdLink path={`${appName}/errors/${groupId}`}>
          {groupId.slice(0, 5) || 'N/A'}
        </GroupIdLink>
      </GroupIdCell>
      <MessageAndCulpritCell>
        <MessageLink path={`${appName}/errors/${groupId}`}>
          {message || 'N/A'}
        </MessageLink>
        <Culprit>{culprit || 'N/A'}</Culprit>
      </MessageAndCulpritCell>
      <OccurrenceCell align={RIGHT_ALIGNMENT}>{count}</OccurrenceCell>
      <OccurrenceCell align={RIGHT_ALIGNMENT}>{timestamp}</OccurrenceCell>
    </KuiTableRow>
  );
}

export default ListItem;
