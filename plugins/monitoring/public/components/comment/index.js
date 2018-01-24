import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { findDOMNode, unmountComponentAtNode } from 'react-dom';

/*
 * https://stackoverflow.com/questions/40015336/how-to-render-a-html-comment-in-react
 */
export class Comment extends Component {
  static propTypes = {
    text: PropTypes.string
  };

  componentDidMount() {
    const el = findDOMNode(this);
    unmountComponentAtNode(el);
    el.outerHTML = this.createComment();
  }

  createComment() {
    const { text } = this.props;
    return `<!-- ${text} -->`;
  }

  render() {
    return <span />;
  }
}
