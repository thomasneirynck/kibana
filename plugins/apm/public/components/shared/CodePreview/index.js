import React from 'react';
import styled from 'styled-components';
import {
  unit,
  units,
  px,
  colors,
  fontFamilyCode,
  borderRadius
} from '../../../style/variables';

import { isEmpty } from 'lodash';

import SyntaxHighlighter, {
  registerLanguage
} from 'react-syntax-highlighter/dist/light';
import { xcode } from 'react-syntax-highlighter/dist/styles';

import javascript from 'react-syntax-highlighter/dist/languages/javascript';
import python from 'react-syntax-highlighter/dist/languages/python';

registerLanguage('javascript', javascript);
registerLanguage('python', python);

const FileDetails = styled.div`
  color: ${colors.gray3};
  padding: ${px(units.quarter)} ${px(unit)};
  border-bottom: 1px solid ${colors.gray4};
  border-radius: ${borderRadius} ${borderRadius} 0 0;
`;

const FileDetail = styled.span`
  font-weight: bold;
`;

const Container = styled.div`
  margin: ${props =>
    props.isLibraryFrame
      ? `${px(units.minus * 1.5)} 0 ${px(units.plus)} 0`
      : `${px(units.plus)} 0`};
  position: relative;
  font-family: ${fontFamilyCode};
  border: 1px solid ${colors.gray4};
  border-radius: ${borderRadius};
  background: ${props => (props.isLibraryFrame ? colors.white : colors.gray5)};

  ${FileDetails} {
    ${props => (!props.hasContext ? 'border-bottom: 0' : null)};
  }

  ${FileDetail} {
    color: ${props => (props.isLibraryFrame ? colors.gray1 : colors.black)};
  }
`;

const ContextContainer = styled.div`
  position: relative;
  border-radius: 0 0 ${borderRadius} ${borderRadius};
`;

const LineHighlight = styled.div`
  position: absolute;
  width: 100%;
  height: ${px(units.eighth * 9)};
  top: ${props =>
    props.lineNumber ? px(props.lineNumber * (units.eighth * 9)) : '0'};
  pointer-events: none;
  background-color: ${colors.yellow};
`;

const LineNumberContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 0 0 0 ${borderRadius};
  background: ${props => (props.isLibraryFrame ? colors.white : colors.gray5)};
`;

const LineNumber = styled.div`
  position: relative;
  min-width: ${px(units.eighth * 21)};
  padding-left: ${px(units.half)};
  padding-right: ${px(units.half)};
  color: ${colors.gray3};
  line-height: ${px(unit + units.eighth)};
  text-align: right;
  border-right: 1px solid ${colors.gray4};
  ${props => (props.marked ? `background-color: ${colors.yellow}` : null)};

  &:last-of-type {
    border-radius: 0 0 0 ${borderRadius};
  }
`;

const LineContainer = styled.div`
  overflow: auto;
  margin: 0 0 0 ${px(units.eighth * 21)};
  padding: 0;
  background-color: ${colors.white};

  &:last-of-type {
    border-radius: 0 0 ${borderRadius} 0;
  }
`;

const Line = styled.pre`
  // Override all styles
  margin: 0;
  color: inherit;
  background: inherit;
  border: 0;
  border-radius: 0;
  overflow: initial;
  padding: 0 ${px(units.eighth * 9)};
  line-height: ${px(units.eighth * 9)};
`;

const Code = styled.code`
  position: relative;
  padding: 0;
  margin: 0;
  white-space: pre;
  z-index: 2;
`;

const getStackframeLines = stackframe => {
  if (!stackframe.context) {
    return [];
  }
  return [
    ...(stackframe.context.pre || []),
    stackframe.line.context,
    ...(stackframe.context.post || [])
  ];
};

const getStartLineNumber = stackframe =>
  stackframe.line.number - stackframe.context.pre.length;

function CodePreview({ stackframe, codeLanguage, isLibraryFrame }) {
  const hasContext = !isEmpty(stackframe.context);

  return (
    <Container hasContext={hasContext} isLibraryFrame={isLibraryFrame}>
      <FileDetails>
        <FileDetail>{stackframe.filename}</FileDetail> in{' '}
        <FileDetail>{stackframe.function}</FileDetail> at {' '}
        <FileDetail>line {stackframe.line.number}</FileDetail>
      </FileDetails>

      {hasContext && (
        <Context
          stackframe={stackframe}
          codeLanguage={codeLanguage}
          isLibraryFrame={isLibraryFrame}
        />
      )}
    </Container>
  );
}

function Context({ stackframe, codeLanguage, isLibraryFrame }) {
  const lines = getStackframeLines(stackframe);
  const startLineNumber = getStartLineNumber(stackframe);
  const lineIndex = stackframe.context.pre.length;
  const language = codeLanguage || 'javascript'; // TODO: Add support for more languages

  return (
    <ContextContainer>
      <LineHighlight lineNumber={lineIndex} />
      <LineNumberContainer isLibraryFrame={isLibraryFrame}>
        {lines.map((line, i) => (
          <LineNumber key={line + i} marked={lineIndex === i}>
            {i + startLineNumber}.
          </LineNumber>
        ))}
      </LineNumberContainer>
      <LineContainer>
        {lines.map((line, i) => (
          <SyntaxHighlighter
            key={line + i}
            language={language}
            style={xcode}
            PreTag={Line}
            CodeTag={Code}
            customStyle={{ padding: null, overflowX: null }}
          >
            {line || '\n'}
          </SyntaxHighlighter>
        ))}
      </LineContainer>
    </ContextContainer>
  );
}

export default CodePreview;
