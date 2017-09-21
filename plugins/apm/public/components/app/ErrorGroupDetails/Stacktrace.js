import React from 'react';
import styled from 'styled-components';
import { units, px, fontFamilyCode } from '../../../style/variables';
import { get } from 'lodash';

const Filename = styled.span`
  font-weight: bold;
  font-family: ${fontFamilyCode};
`;

const ContextWrap = styled.pre`
  margin-top: ${px(units.half)};
  margin-bottom: ${px(units.plus)};
`;

function Stacktrace({ stacktraces = [] }) {
  return (
    <div>
      {stacktraces.map((item, i) => {
        const pre = get(item, 'context.pre', []);
        const post = get(item, 'context.post', []);

        return (
          <div key={i}>
            <div>
              <Filename>{item.absPath}</Filename> in{' '}
              <Filename>{item.function}</Filename>
            </div>

            <ContextWrap>
              <code>
                {pre.map(line => {
                  return `${line} \n`;
                })}
                {item.line.context}
                {post.map(line => {
                  return `${line} \n`;
                })}
              </code>
            </ContextWrap>
          </div>
        );
      })}
    </div>
  );
}

export default Stacktrace;
