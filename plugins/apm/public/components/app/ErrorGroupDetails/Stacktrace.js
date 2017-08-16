import React, { Component } from 'react';
import styled from 'styled-components';
import { units, px, fontFamilyCode } from '../../../style/variables';
import { get } from 'lodash';

const Container = styled.div``;

const Filename = styled.span`
  font-weight: bold;
  font-family: ${fontFamilyCode};
`;

const ContextWrap = styled.pre`
  margin-top: ${px(units.half)};
  margin-bottom: ${px(units.plus)};
`;

const Context = styled.code``;

class Stacktrace extends Component {
  render() {
    const errorGroup = this.props.errorGroup;
    const stacktraces = get(errorGroup, 'error.error.exception.stacktrace');

    if (!stacktraces) {
      return null;
    }

    return (
      <Container>
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
                <Context>
                  {pre.map(line => {
                    return line + '\n';
                  })}
                  {item.line.context}
                  {post.map(line => {
                    return line + '\n';
                  })}
                </Context>
              </ContextWrap>
            </div>
          );
        })}
      </Container>
    );
  }
}

export default Stacktrace;
