import PropTypes from 'prop-types';

import React, {
  Component,
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

import { VALIDATION_STATUS } from 'plugins/ml/../common/constants/validation';

const getDefaultState = () => ({
  ui: {
    isModalVisible: false,
  },
  data: {
    messages: [],
    success: false
  }
});

export function validateJobProvider($injector) {
  const mlJobService = $injector.get('mlJobService');

  class ValidateJob extends Component {
    constructor(props) {
      super(props);

      this.state = getDefaultState();

      this.closeModal = this.closeModal.bind(this);
      this.openModal = this.openModal.bind(this);
    }


    closeModal() {
      this.setState(getDefaultState());
    }

    openModal() {
      mlJobService.validateJob(this.props.job).then((data) => {
        this.setState({
          ui: { isModalVisible: true },
          data
        });
      });
    }

    renderRows() {
      return this.state.data.messages.map((message) => {
        message.health = message.status;
        if (message.health === VALIDATION_STATUS.ERROR) {
          message.health = 'danger';
        }

        let url;
        if (message.url) {
          url = <EuiLink href={message.url} target="BLANK">More Information</EuiLink>;
        }
        return (
          <EuiTableRow key={message.id}>
            <EuiTableRowCell className="mlHealthColumn" align="right"><EuiHealth color={message.health} /></EuiTableRowCell>
            <EuiTableRowCell>{message.text}</EuiTableRowCell>
            <EuiTableRowCell>{url}</EuiTableRowCell>
          </EuiTableRow>
        );
      });
    }

    render() {
      let messages;
      let modal;

      if (this.state.ui.isModalVisible) {
        if (this.state.data.success && this.state.data.messages.length > 0) {
          messages = (
            <div>
              <p>The following issues have been identified with this job configuration:</p>
              <EuiTable compressed>
                <EuiTableHeader>
                  <EuiTableHeaderCell width="20"/>
                  <EuiTableHeaderCell />
                  <EuiTableHeaderCell width="120"/>
                </EuiTableHeader>
                <EuiTableBody>
                  {this.renderRows()}
                </EuiTableBody>
              </EuiTable>
            </div>
          );
        } else {
          messages = (
            <EuiCallOut
              size="s"
              title="Job validation was successful and didn't return any warnings or errors."
              iconType="pin"
            />
          );
        }

        modal = (
          <EuiOverlayMask>
            <EuiModal
              onClose={this.closeModal}
              style={{ width: '800px' }}
            >
              <EuiModalHeader>
                <EuiModalHeaderTitle >
                  Validate job {this.props.job.job_id}
                </EuiModalHeaderTitle>
              </EuiModalHeader>

              <EuiModalBody>
                {messages}
              </EuiModalBody>

              <EuiModalFooter>
                <EuiButton
                  onClick={this.closeModal}
                  size="s"
                  fill
                >
                  Close
                </EuiButton>
              </EuiModalFooter>
            </EuiModal>
          </EuiOverlayMask>
        );
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

          {modal}
        </div>
      );
    }
  }

  ValidateJob.propTypes = {
    job: PropTypes.object
  };

  return ValidateJob;
}
