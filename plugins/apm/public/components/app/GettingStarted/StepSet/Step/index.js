import React from 'react';
import { STATUS } from '../../../../../constants';

import styled from 'styled-components';
import { KuiButton } from 'ui_framework/components';
import { px, unit, units, fontSizes } from '../../../../../style/variables';

import Indicator from './Indicator';
import StatusCheckText from './StatusCheckText';
import CopyButton from './CopyButton';
import MarkdownRenderer from 'react-markdown-renderer';

import SyntaxHighlighter, {
  registerLanguage
} from 'react-syntax-highlighter/dist/light';
import { xcode } from 'react-syntax-highlighter/dist/styles';

import bash from 'react-syntax-highlighter/dist/languages/bash';
import javascript from 'react-syntax-highlighter/dist/languages/javascript';
import python from 'react-syntax-highlighter/dist/languages/python';

registerLanguage('bash', bash);
registerLanguage('javascript', javascript);
registerLanguage('python', python);

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

const Description = styled.div`
  max-width: 80%;
`;

const CheckStatusButton = styled(KuiButton)`
  margin: ${px(unit)} 0;
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
            <MarkdownRenderer markdown={step.textPre || ''} />
          </Description>
        )}

        {step.code && (
          <CodeWrapper>
            <CopyButton
              target={`[data-step-id="${step.indicatorNumber}"] code`}
            >
              Copy snippet
            </CopyButton>

            <SyntaxHighlighter
              language={step.codeLanguage || 'bash'}
              style={xcode}
              customStyle={{
                color: null,
                padding: null,
                background: null,
                overflowX: null
              }}
            >
              {step.code || ''}
            </SyntaxHighlighter>
          </CodeWrapper>
        )}

        {step.textPost && (
          <Description>
            <MarkdownRenderer markdown={step.textPost || ''} />
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
