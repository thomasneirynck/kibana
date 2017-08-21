import React from 'react';
import styled from 'styled-components';
import { Table, TableHead, TableLoader } from '../../shared/Table';
import ListItem from './ListItem';
import { colors, borderRadius } from '../../../style/variables';

const ErrorsContainer = styled.div`
  position: relative;
  overflow: hidden;
  padding: 0;
  border: 1px solid ${colors.elementBorder};
  border-radius: ${borderRadius};
`;

function List({ appName, list }) {
  return (
    <ErrorsContainer>
      <Table>
        <thead>
          <tr>
            <TableHead>Error grouping</TableHead>
            <TableHead>Occurrences</TableHead>
          </tr>
        </thead>

        <tbody>
          <TableLoader status={list.status} columns={2} />

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
