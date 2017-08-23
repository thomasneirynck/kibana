import PropTypes from 'prop-types';
import React from 'react';

import { IssueSymbol } from './issue_symbol';


export function Issue({ details, level, message, url }) {
  return (
    <li className='kuiMenuItem'>
      <div className='kuiEvent'>
        <IssueSymbol level={ level } />

        <div className='kuiEventBody'>
          <div className='kuiEventBody__message'>
            { message }{ details ? `: ${details }` : null}
          </div>
          <div className='kuiEventBody__metadata'>
            {
              url
              ? <a className='kuiLink' href={ url }>View Documentation</a>
              : null
            }
          </div>
        </div>
      </div>
    </li>
  );
}

Issue.propTypes = {
  details: PropTypes.string,
  level: PropTypes.string,
  message: PropTypes.string,
  url: PropTypes.string,
};

Issue.defaultProps = {
  details: null,
  level: null,
  message: null,
  url: null,
};
