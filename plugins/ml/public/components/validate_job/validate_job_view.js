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


import PropTypes from 'prop-types';

import React, {
  Component
} from 'react';

import {
  EuiButton,
  EuiCallOut,
  EuiHealth,
  EuiLink,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiTable,
  EuiTableBody,
  EuiTableHeader,
  EuiTableHeaderCell,
  EuiTableRow,
  EuiTableRowCell
} from '@elastic/eui';

// don't use something like plugins/ml/../common
// because it won't work with the jest tests
import { VALIDATION_STATUS } from '../../../common/constants/validation';

const getDefaultState = () => ({
  ui: {
    isModalVisible: false,
  },
  data: {
    messages: [],
    success: false
  }
});

const statusToEuiColor = (status) => {
  if (status === VALIDATION_STATUS.ERROR) {
    return 'danger';
  }
  return status;
};

const link = (url) => {
  if (!url) {
    return null;
  }
  return <EuiLink href={url} target="BLANK">Learn More</EuiLink>;
};

const messageRow = (message) => (
  <EuiTableRow key={message.id}>
    <EuiTableRowCell className="mlHealthColumn" align="right">
      <EuiHealth color={statusToEuiColor(message.status)} />
    </EuiTableRowCell>
    <EuiTableRowCell>{message.text}</EuiTableRowCell>
    <EuiTableRowCell>{link(message.url)}</EuiTableRowCell>
  </EuiTableRow>
);

const messageRows = (data) => {
  if (data.success && data.messages.length > 0) {
    return (
      <div>
        <p>The following issues have been identified with this job configuration:</p>
        <EuiTable compressed>
          <EuiTableHeader>
            <EuiTableHeaderCell width="20" />
            <EuiTableHeaderCell />
            <EuiTableHeaderCell width="120" />
          </EuiTableHeader>
          <EuiTableBody>
            {data.messages.map(messageRow)}
          </EuiTableBody>
        </EuiTable>
      </div>
    );
  } else if (data.success && data.messages.length === 0) {
    return (
      <EuiCallOut
        size="s"
        title="Job validation was successful and didn't return any warnings or errors."
        iconType="pin"
      />
    );
  }
  return null;
};

const modal = ({ isVisible, closeModal, jobId, data }) => {
  // data.success === false means the API error will be displayed in a Message Bar
  // so we want to avoid displaying the Modal
  if (!isVisible || data.success === false) {
    return null;
  }

  return (
    <EuiOverlayMask>
      <EuiModal
        onClose={closeModal}
        style={{ width: '800px' }}
      >
        <EuiModalHeader>
          <EuiModalHeaderTitle >
            Validate job {jobId}
          </EuiModalHeaderTitle>
        </EuiModalHeader>

        <EuiModalBody>
          {messageRows(data)}
        </EuiModalBody>

        <EuiModalFooter>
          <EuiButton
            onClick={closeModal}
            size="s"
            fill
          >
            Close
          </EuiButton>
        </EuiModalFooter>
      </EuiModal>
    </EuiOverlayMask>
  );
};

class ValidateJob extends Component {
  constructor(props) {
    super(props);
    this.state = getDefaultState();
  }

  closeModal = () => {
    this.setState(getDefaultState());
  };

  openModal = () => {
    this.props.mlJobService.validateJob(this.props.job).then((data) => {
      console.log('resolving the promise', data);
      this.setState({
        ui: { isModalVisible: true },
        data
      });
    });
  };

  render() {
    const job = this.props.job;
    if (typeof job === 'undefined' || typeof job.job_id === 'undefined') {
      return null;
    }

    return (
      <div>
        <EuiButton
          onClick={this.openModal}
          size="s"
          fill
        >
          Validate Job
        </EuiButton>

        {modal({
          closeModal: this.closeModal,
          isVisible: this.state.ui.isModalVisible,
          jobId: job.job_id,
          data: this.state.data
        })}
      </div>
    );
  }
}

ValidateJob.propTypes = {
  job: PropTypes.object
};

export { ValidateJob };
