import React from 'react';
import styled from 'styled-components';
import { unit, units, px, colors } from '../../../../../../style/variables';

const CodeContainer = styled.div`
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
  background-color: ${props => (props.marked ? colors.teal : 'initial')};

  ${LinePreview} {
    background-color: ${props => (props.marked ? colors.teal : 'initial')};
  }
`;

const LineNumber = styled.div`
  flex: 0 0 ${px(unit * 4)};
  background: ${colors.gray5};
  text-align: center;
  color: ${colors.gray3};
  border-left: 1px solid ${colors.gray4};
  border-right: 1px solid ${colors.gray4};
`;

const FileInfo = styled.div`
  border: 1px solid ${colors.gray4};
  background: ${colors.gray5};
  padding: ${px(units.quarter)} ${px(unit)};
`;

const getStacktraceLines = stacktrace => [
  ...stacktrace.context.pre,
  stacktrace.line.context,
  ...stacktrace.context.post
];

const getStartLineNumber = stacktrace =>
  stacktrace.line.number - stacktrace.context.pre.length;

function CodePreview({ stacktrace }) {
  const lines = getStacktraceLines(stacktrace);
  const startLineNumber = getStartLineNumber(stacktrace);
  const lineIndex = stacktrace.context.pre.length;

  return (
    <div>
      <FileInfo>
        <strong>{stacktrace.filename}</strong> in{' '}
        <strong>{stacktrace.function}</strong> at line{' '}
        <strong>{stacktrace.line.number}</strong>
      </FileInfo>
      <CodeContainer>
        {lines.map((line, i) => (
          <LineContainer key={line + i} marked={lineIndex === i}>
            <LineNumber>{i + startLineNumber}.</LineNumber>
            <LinePreview>{line}</LinePreview>
          </LineContainer>
        ))}
      </CodeContainer>
    </div>
  );
}

export default CodePreview;
