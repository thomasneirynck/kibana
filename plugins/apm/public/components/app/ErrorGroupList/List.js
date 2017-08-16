import React from 'react';
import Loader from './Loader';
import ListItem from './ListItem';
import styled from 'styled-components';
import { units, px, colors, borderRadius } from '../../../style/variables';

const ErrorsContainer = styled.div`
  position: relative;
  overflow: hidden;
  padding: 0;
  border: 1px solid ${colors.elementBorder};
  border-radius: ${borderRadius};
`;

const Table = styled.table`width: 100%;`;

const TableHeading = styled.th`
  text-align: right;
  border-bottom: 1px solid ${colors.elementBorder};
  border-left: 1px solid ${colors.tableBorder};
  padding: ${px(units.minus)};
  position: relative;
  cursor: pointer;

  &:first-child {
    border-left: 0;
    text-align: left;
  }
`;

function List({ appName, list }) {
  return (
    <ErrorsContainer>
      <Table>
        <thead>
          <tr>
            <TableHeading>Error grouping</TableHeading>
            <TableHeading>Occurrences</TableHeading>
          </tr>
        </thead>

        <tbody>
          <Loader status={list.status} />

          {list.data.map(error => {
            return (
              <ListItem
                key={error.groupingId}
                appName={appName}
                error={error}
              />
            );
          })}
        </tbody>
      </Table>
    </ErrorsContainer>
  );
}

export default List;
