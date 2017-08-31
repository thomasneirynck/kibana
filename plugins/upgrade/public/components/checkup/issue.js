import PropTypes from 'prop-types';
import React from 'react';

import { IssueSymbol } from './issue_symbol';


export function Issue({ details, level, message, issueInfo, url }) {
  return (
    <li className="kuiMenuItem">
      <div className="kuiEvent">
        <IssueSymbol level={level} />

        <div className="kuiEventBody">
          <div className="kuiEventBody__message kuiTextTitle">
            { message }
          </div>
          <div className="kuiEventBody__message">
            { issueInfo ? `${issueInfo} ` : null }
            { url
              ? <a className="kuiLink" href={url}>Read Documentation</a>
              : null
            }
          </div>
          { details
            ? (
              <div className="kuiEventBody__metadata">
                Details: {details}
              </div>
            )
            : null
          }
        </div>
      </div>
    </li>
  );
}

Issue.propTypes = {
  details: PropTypes.string,
  level: PropTypes.string,
  message: PropTypes.string,
  issueInfo: PropTypes.string,
  url: PropTypes.string,
};

Issue.defaultProps = {
  details: null,
  level: null,
  message: null,
  issueInfo: null,
  url: null,
};
