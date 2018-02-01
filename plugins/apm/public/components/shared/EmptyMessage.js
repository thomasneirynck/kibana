import React from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import { units, px, fontSizes, fontSize } from '../../style/variables';
import { get } from 'lodash';
import { KuiTableInfo } from 'ui_framework/components';
import { APM_DOCS } from '../../utils/documentation';
import { ExternalLink } from '../../utils/url';

const Container = styled(KuiTableInfo)`
  text-align: center;
  font-size: ${fontSizes.large};
`;

const HelpMessage = styled.div`
  text-align: center;
  font-size: ${fontSize};
  margin-top: ${px(units.half)};
`;

function EmptyMessage({ heading, showSubheading }) {
  const subheading = (
    <HelpMessage>
      <span>
        {
          " Oops! You should try another time range. If that's no good, there's always the "
        }
        <ExternalLink href={get(APM_DOCS, 'get-started.url')}>
          documentation.
        </ExternalLink>
      </span>
    </HelpMessage>
  );

  return (
    <Container>
      {heading || 'No data found.'}
      {showSubheading ? subheading : null}
    </Container>
  );
}

EmptyMessage.propTypes = {
  heading: PropTypes.string,
  showSubheading: PropTypes.bool
};

EmptyMessage.defaultProps = {
  showSubheading: true
};

export default EmptyMessage;
