import React from 'react';
import styled from 'styled-components';
import _ from 'lodash';
import PRIORITIZED_PROPERTIES from './prioritizedProperties.json';
import { units, colors } from '../../../../style/variables';

const Table = styled.table`
  font-family: monospace;
  width: 100%;
`;
const TableRow = styled.tr`
  border-bottom: 1px solid ${colors.elementBorder};
  &:last-child {
    border: 0;
  }
`;
const TableCell = styled.td`
  vertical-align: top;
  padding: ${units.quarter}px 0;

  ${TableRow}:first-child> & {
    padding-top: 0;
  }

  ${TableRow}:last-child> & {
    padding-bottom: 0;
  }

  &:first-child {
    width: 300px;
    font-weight: bold;
  }
`;
const EmptyValue = styled.span`color: #ccc;`;

function getSortedList(data, secondLevelProps) {
  if (secondLevelProps) {
    return secondLevelProps;
  }

  return _.sortBy(_.map(data, (value, key) => ({ value, key })), 'key');
}

function formatValue(value) {
  if (_.isObject(value)) {
    return (
      <pre>
        {JSON.stringify(value, null, 4)}
      </pre>
    );
  } else if (_.isBoolean(value)) {
    return String(value);
  } else if (!value) {
    return <EmptyValue>N/A</EmptyValue>;
  }

  return value;
}

function formatKey(key, value) {
  if (value === undefined || value === null) {
    return (
      <EmptyValue>
        {key}
      </EmptyValue>
    );
  }

  return key;
}

function getSecondLevelProps(tabData, tabKey) {
  const prioritizedSecondLevelProps = _.get(
    _.find(PRIORITIZED_PROPERTIES, { key: tabKey }),
    'children'
  );
  const sortedSecondLevelProps = Object.keys(tabData).sort();

  return _.uniq([
    ...prioritizedSecondLevelProps,
    ...sortedSecondLevelProps
  ]).map(key => ({ key, value: tabData[key] }));
}

function recursiveSort(data, level, secondLevelProps) {
  return (
    <Table>
      <tbody>
        {getSortedList(data, secondLevelProps).map(({ key, value }) => {
          return (
            <TableRow key={key}>
              <TableCell>
                {formatKey(key, value)}
              </TableCell>
              <TableCell>
                {level < 3 && _.isObject(value)
                  ? recursiveSort(value, level + 1)
                  : formatValue(value)}
              </TableCell>
            </TableRow>
          );
        })}
      </tbody>
    </Table>
  );
}

export default function SortedTable({ tabData, tabKey }) {
  if (!tabData) {
    return <div>No data</div>;
  }

  const secondLevelProps = getSecondLevelProps(tabData, tabKey);
  return recursiveSort(tabData, 2, secondLevelProps);
}
