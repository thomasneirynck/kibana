/*
 * ELASTICSEARCH CONFIDENTIAL
 *
 * Copyright (c) 2017 Elasticsearch BV. All Rights Reserved.
 *
 * Notice: this software, and all information contained
 * therein, is the exclusive property of Elasticsearch BV
 * and its licensors, if any, and is protected under applicable
 * domestic and foreign law, and international treaties.
 *
 * Reproduction, republication or distribution without the
 * express written consent of Elasticsearch BV is
 * strictly prohibited.
 */

import React, { Component, PropTypes } from 'react';

export class RecognizedResult extends Component {

  render() {
    const {
      config,
      indexPattern
    } = this.props;

    const href = `#/jobs/new_job/simple/recognize/create?id=${config.id}&index=${indexPattern.id}`;
    let logo = null;
    // if a logo is available, use that, otherwise display the id
    // the logo should be a base64 encoded image
    if (config.logo && config.logo.src) {
      logo = <div><img src={ config.logo.src }/></div>;
    } else {
      logo = <h3>{config.id}</h3>;
    }

    return (
      <a className='recognizer-result' href={ href }>
        { logo }
        <div>
          <span >Create {config.title} jobs</span>
        </div>
      </a>
    );
  }
}

RecognizedResult.propTypes = {
  config: PropTypes.object,
  indexPattern: PropTypes.object,
};
