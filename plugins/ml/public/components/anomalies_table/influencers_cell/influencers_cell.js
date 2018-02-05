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

import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { EuiLink } from '@elastic/eui';

/*
 * Component for rendering a list of record influencers inside a cell in the anomalies table.
 * Truncates long lists of influencers to the supplied limit, with the full list of influencers
 * expanded or collapsed via 'and x more' / 'show less' links.
 */
export class InfluencersCell extends Component {
  constructor(props) {
    super(props);

    this.limit = props.limit;
    const recordInfluencers = props.influencers || [];
    this.influencers = [];
    _.each(recordInfluencers, (influencer) => {
      _.each(influencer, (influencerFieldValue, influencerFieldName) => {
        this.influencers.push({
          influencerFieldName,
          influencerFieldValue
        });
      });
    });

    // Allow one more influencer than the supplied limit as displaying
    // 'and 1 more' would take up an extra line.
    const showAll = this.influencers.length <= (this.limit + 1);
    this.state = {
      showAll
    };
  }

  toggleAllInfluencers() {
    this.setState({ showAll: !this.state.showAll });
  }

  renderInfluencers() {
    const numberToDisplay = this.state.showAll === false ? this.limit : this.influencers.length;
    const displayInfluencers = this.influencers.slice(0, numberToDisplay);

    this.othersCount = Math.max(this.influencers.length - numberToDisplay, 0);
    if (this.othersCount === 1) {
      // Display the additional influencer.
      displayInfluencers.push(this.influencers[this.limit]);
      this.othersCount = 0;
    }

    return displayInfluencers.map((influencer, index) => {
      return (
        <div key={index}>{influencer.influencerFieldName}: {influencer.influencerFieldValue}</div>
      );
    });
  }

  renderOthers() {
    if (this.othersCount > 0) {
      return (
        <div>
          <EuiLink
            onClick={() => this.toggleAllInfluencers()}
          >
          and {this.othersCount} more
          </EuiLink>
        </div>
      );
    } else if (this.influencers.length > this.limit + 1) {
      return (
        <div>
          <EuiLink
            onClick={() => this.toggleAllInfluencers()}
          >
          show less
          </EuiLink>
        </div>
      );
    }
  }

  render() {
    return (
      <div>
        {this.renderInfluencers()}
        {this.renderOthers()}
      </div>
    );
  }
}

InfluencersCell.propTypes = {
  influencers: PropTypes.array,
  limit: PropTypes.number
};
