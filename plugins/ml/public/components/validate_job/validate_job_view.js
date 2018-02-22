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
  switch (status) {
    case VALIDATION_STATUS.INFO:
      return 'primary';
      break;
    case VALIDATION_STATUS.ERROR:
      return 'danger';
      break;
    default:
      return status;
  }
};

const Link = ({ url }) => (<EuiLink href={url} target="_BLANK">Learn More</EuiLink>);
Link.propTypes = {
  url: PropTypes.string.isRequired
};

const MessageRow = ({ message }) => (
  <EuiTableRow>
    <EuiTableRowCell className="mlHealthColumn" align="right">
      <EuiHealth color={statusToEuiColor(message.status)} />
    </EuiTableRowCell>
    <EuiTableRowCell>{message.text}</EuiTableRowCell>
    <EuiTableRowCell>{message.url && <Link url={message.url} />}</EuiTableRowCell>
  </EuiTableRow>
);
MessageRow.propTypes = {
  message: PropTypes.shape({
    status: PropTypes.string,
    text: PropTypes.string,
    url: PropTypes.string
  })
};

const MessageTable = ({ messages }) => (
  <div>
    <p>Job validation retrieved the following messages:</p>
    <EuiTable compressed>
      <EuiTableHeader>
        <EuiTableHeaderCell width="20" />
        <EuiTableHeaderCell />
        <EuiTableHeaderCell width="120" />
      </EuiTableHeader>
      <EuiTableBody>
        {messages.map((m, i) => <MessageRow key={m.id + '_' + i} message={m} />)}
      </EuiTableBody>
    </EuiTable>
  </div>
);
MessageTable.propTypes = {
  messages: PropTypes.array.isRequired
};

const SuccessfulValidation = () => (
  <EuiCallOut
    size="s"
    title="Job validation was successful and didn't return any warnings or errors."
    iconType="pin"
  />
);

const Modal = ({ close, title, children }) => (
  <EuiOverlayMask>
    <EuiModal
      onClose={close}
      style={{ width: '800px' }}
    >
      <EuiModalHeader>
        <EuiModalHeaderTitle>{title}</EuiModalHeaderTitle>
      </EuiModalHeader>

      <EuiModalBody>
        {children}
      </EuiModalBody>

      <EuiModalFooter>
        <EuiButton
          onClick={close}
          size="s"
          fill
        >
          Close
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  </EuiOverlayMask>
);
Modal.propType = {
  close: PropTypes.func.isRequired,
  title: PropTypes.string
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
      this.setState({
        ui: { isModalVisible: true },
        data
      });
    });
  };

  render() {
    const fill = (this.props.fill === false) ? false : true;
    const job = this.props.job;
    const disabled = (typeof job === 'undefined' || typeof job.job_id === 'undefined');

    return (
      <div>
        <EuiButton
          onClick={this.openModal}
          size="s"
          fill={fill}
          isDisabled={disabled}
        >
          Validate Job
        </EuiButton>

        {!disabled && this.state.ui.isModalVisible &&
          <Modal
            close={this.closeModal}
            title={'Validate job ' + (job && job.job_id)}
          >
            {(this.state.data.success && this.state.data.messages.length > 0)
              ? <MessageTable messages={this.state.data.messages} />
              : <SuccessfulValidation />
            }
          </Modal>
        }
      </div>
    );
  }
}
ValidateJob.propTypes = {
  fill: PropTypes.bool,
  job: PropTypes.object,
  mlJobService: PropTypes.object
};

export { ValidateJob };
