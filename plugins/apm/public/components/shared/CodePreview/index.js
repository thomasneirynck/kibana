import React from 'react';
import styled from 'styled-components';
import {
  unit,
  units,
  px,
  colors,
  fontFamilyCode
} from '../../../style/variables';

const CodeContainer = styled.div`
  border-right: 1px solid ${colors.gray4};
  border-bottom: 1px solid ${colors.gray4};
  overflow: scroll;
`;

const LinePreview = styled.div`
  white-space: pre;
  margin-left: ${px(unit)};
  font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
`;

const LineContainer = styled.div`
  display: flex;
  background-color: ${props => (props.marked ? colors.yellow : 'initial')};

  ${LinePreview} {
    background-color: ${props => (props.marked ? colors.yellow : 'initial')};
  }
`;

const LineNumber = styled.div`
  flex: 0 0 ${px(unit * 2.5)};
  text-align: center;
  color: ${colors.gray3};
  border-left: 1px solid ${colors.gray4};
  border-right: 1px solid ${colors.gray4};
`;

const FileDetails = styled.div`
  color: ${colors.gray3};
  border: 1px solid ${colors.gray4};
  padding: ${px(units.quarter)} ${px(unit)};
`;

const FileDetail = styled.span`color: ${colors.black};`;

const Container = styled.div`
  margin: ${px(unit)} 0;
  font-family: ${fontFamilyCode};

  ${FileDetails} {
    background: ${props =>
      props.isLibraryFrame ? colors.white : colors.gray5};
  }

  ${FileDetail} {
    font-weight: ${props => (props.isLibraryFrame ? 400 : 600)};
  }

  ${LineNumber} {
    background: ${props =>
      props.isLibraryFrame ? colors.white : colors.gray5};
  }

  ${LinePreview} {
    color: ${props => (props.isLibraryFrame ? colors.gray3 : colors.black)};
  }
`;

const getStackframeLines = stackframe => {
  if (!stackframe.context) {
    return [];
  }
  return [
    ...stackframe.context.pre,
    stackframe.line.context,
    ...stackframe.context.post
  ];
};

const getStartLineNumber = stackframe =>
  stackframe.line.number - stackframe.context.pre.length;

function CodePreview({ stackframe, isLibraryFrame }) {
  return (
    <Container isLibraryFrame={isLibraryFrame}>
      <FileDetails>
        <FileDetail>{stackframe.filename}</FileDetail> in{' '}
        <FileDetail>{stackframe.function}</FileDetail> at {' '}
        <FileDetail>line {stackframe.line.number}</FileDetail>
      </FileDetails>

      <Code stackframe={stackframe} />
    </Container>
  );
}

function Code({ stackframe, isLibraryFrame }) {
  if (!stackframe.context) {
    return null;
  }

  const lines = getStackframeLines(stackframe);
  const startLineNumber = getStartLineNumber(stackframe);
  const lineIndex = stackframe.context.pre.length;

  return (
    <CodeContainer isLibraryFrame={isLibraryFrame}>
      {lines.map((line, i) => (
        <LineContainer key={line + i} marked={lineIndex === i}>
          <LineNumber>{i + startLineNumber}.</LineNumber>
          <LinePreview>{line}</LinePreview>
        </LineContainer>
      ))}
    </CodeContainer>
  );
}

export default CodePreview;
