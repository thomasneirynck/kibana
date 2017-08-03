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
import { RecognizedResult } from './recognized_result';

export function dataRecognizerProvider(ml) {

  class DataRecognizer extends Component {
    constructor(props) {
      super(props);

      this.state = {
        results: []
      };

      this.indexPatternTitle = props.indexPatternTitle;
    }

    componentDidMount() {
      // once the mount is complete, call the recognize endpoint to see if the index format is known to us,
      ml.recognizeIndex({ indexPatternTitle: this.indexPatternTitle })
      .then((resp) => {
        const results = resp.map((r) => (
          <RecognizedResult
            key={ r.id }
            config={ r }
          />
        ));

        this.setState({
          results
        });
      });
    }

    render() {
      let label = null;
      if (this.state.results.length !== 0) {
        label = <div>Index contains recognized data:</div>;
      }

      return (
        <div>
          { label }
          <div>{this.state.results}</div>
        </div>
      );
    }
  }

  DataRecognizer.propTypes = {
    indexPatternTitle: PropTypes.string,
  };

  return DataRecognizer;
}
