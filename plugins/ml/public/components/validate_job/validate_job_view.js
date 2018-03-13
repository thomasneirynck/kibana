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
  EuiLink,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiSpacer
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

const statusToEuiIconType = (status) => {
  switch (status) {
    case VALIDATION_STATUS.INFO:
      return 'pencil';
      break;
    case VALIDATION_STATUS.ERROR:
      return 'cross';
      break;
    case VALIDATION_STATUS.SUCCESS:
      return 'check';
      break;
    case VALIDATION_STATUS.WARNING:
      return 'alert';
      break;
    default:
      return status;
  }
};

const Link = ({ url }) => (<EuiLink href={url} target="_BLANK">Learn more</EuiLink>);
Link.propTypes = {
  url: PropTypes.string.isRequired
};

// Message is its own component so it can be passed
// as the "title" prop in the Callout component.
const Message = ({ message }) => (
  <React.Fragment>
    {message.text} {message.url && <Link url={message.url} />}
  </React.Fragment>
);
Message.propTypes = {
  message: PropTypes.shape({
    text: PropTypes.string,
    url: PropTypes.string
  })
};

const Callout = ({ message }) => (
  <React.Fragment>
    <EuiCallOut
      color={statusToEuiColor(message.status)}
      size="s"
      title={<Message message={message} />}
      iconType={statusToEuiIconType(message.status)}
    />
    <EuiSpacer size="m" />
  </React.Fragment>
);
Callout.propTypes = {
  message: PropTypes.shape({
    status: PropTypes.string,
    text: PropTypes.string,
    url: PropTypes.string
  })
};

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

const getJobConfiguration = (job) => {
  let jobConfiguration;

  if (typeof job === 'object') {
    jobConfiguration = job;
  } else if (typeof job === 'function') {
    jobConfiguration = job();
  }

  return jobConfiguration;
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
    const jobConfiguration = getJobConfiguration(this.props.job);

    if (typeof jobConfiguration === 'object') {
      this.props.mlJobService.validateJob({
        duration: this.props.duration,
        fields: this.props.fields,
        job: jobConfiguration
      }).then((data) => {
        this.setState({
          ui: { isModalVisible: true },
          data
        });
      });
    }
  };

  render() {
    const fill = (this.props.fill === false) ? false : true;
    const job = this.props.job;
    const disabled = (typeof job === 'undefined');

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
            title={'Validate job ' + (typeof job === 'object' && job.job_id)}
          >
            {this.state.data.messages.map(
              (m, i) => <Callout key={m.id + '_' + i} message={m} />
            )}
          </Modal>
        }
      </div>
    );
  }
}
ValidateJob.propTypes = {
  duration: PropTypes.object,
  fields: PropTypes.object,
  fill: PropTypes.bool,
  job: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.func
  ]),
  mlJobService: PropTypes.object
};

export { ValidateJob };
