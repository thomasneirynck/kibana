import React from 'react';
import { STATUS } from '../../../../../constants';

import styled from 'styled-components';
import { KuiButton, KuiButtonIcon } from 'ui_framework/components';
import { px, unit, units, fontSizes } from '../../../../../style/variables';

import Indicator from './Indicator';
import StatusCheckText from './StatusCheckText';
import CopyButton from './CopyButton';
import MarkdownRenderer from 'react-markdown-renderer';

import { EuiCodeBlock, EuiText } from '@elastic/eui';

const StepWrapper = styled.div`
  display: flex;
  margin: ${px(units.plus)} 0;
  padding: 0 ${px(units.double)};
`;

const Timeline = styled.div``;

const Content = styled.div`
  width: 100%;
`;

const Title = styled.h3`
  margin: ${px(units.quarter)} 0 ${px(unit)} 0;
  font-size: ${fontSizes.xlarge};
`;

const DownloadButton = styled(KuiButton)`
  margin: ${px(units.half)} 0;
`;

const Description = styled.div`
  max-width: 80%;
`;

const CheckStatusButton = styled(KuiButton)`
  margin: ${px(unit)} 0;
  float: left; // IE fix
`;

const CodeWrapper = styled.div`
  position: relative;
  margin: ${px(unit)} 0 ${px(unit)} 0;
`;

function Step({ step, isLastStep, checkStatus, result, type }) {
  return (
    <StepWrapper data-step-id={step.indicatorNumber}>
      <Timeline>
        <Indicator step={step} isLastStep={isLastStep} result={result} />
      </Timeline>
      <Content>
        <Title>{step.title || ''}</Title>
        {step.textPre && (
          <Description>
            <EuiText>
              <MarkdownRenderer markdown={step.textPre || ''} />
            </EuiText>
          </Description>
        )}
        {step.downloadButton && (
          <a
            href="https://www.elastic.co/downloads/apm/apm-server"
            target="_blank"
          >
            <DownloadButton
              buttonType="secondary"
              icon={<KuiButtonIcon className="fa-external-link" />}
            >
              Download APM Server on Elastic.co
            </DownloadButton>
          </a>
        )}

        {step.code && (
          <CodeWrapper>
            <CopyButton
              target={`[data-step-id="${step.indicatorNumber}"] code`}
            >
              Copy snippet
            </CopyButton>

            <EuiCodeBlock
              language={step.codeLanguage || 'bash'}
              fontSize="m"
              paddingSize="m"
            >
              {step.code || ''}
            </EuiCodeBlock>
          </CodeWrapper>
        )}

        {step.textPost && (
          <Description>
            <EuiText>
              <MarkdownRenderer markdown={step.textPost || ''} />
            </EuiText>
          </Description>
        )}

        {step.isStatusStep && (
          <CheckStatusButton buttonType="secondary" onClick={checkStatus}>
            Check {type} status
          </CheckStatusButton>
        )}

        {step.isStatusStep && <StatusCheckInformation result={result} />}
      </Content>
    </StepWrapper>
  );
}

function StatusCheckInformation({ result }) {
  if (result.status === STATUS.LOADING) {
    return <StatusCheckText type="info" icon="info" text="Loading..." />;
  }
  if (result.completed) {
    return <StatusCheckText type="success" icon="check" text="Success" />;
  }
  if (result.completed === false) {
    return <StatusCheckText type="warning" icon="bolt" text="No data found" />;
  }

  return null;
}

export default Step;
