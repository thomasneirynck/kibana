/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

// @ts-ignore
import React, { Component } from 'react';
import _ from 'lodash';
import moment from 'moment';

import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiTitle,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiButtonEmpty,
  EuiHorizontalRule,
  EuiFieldText,
  EuiDatePicker,
} from '@elastic/eui';
import { getCoreStart } from '../services';
import { ROUTES_DOC } from '../../common';

export interface FoobarProps {
  closeFlyout: () => {};
  docId: string;
  indexId: string;
}

interface State {
  fields?: any;
  doc?: any;
}

export class Foobar extends Component<FoobarProps, State> {
  state: State = {};

  private _isMounted = false;

  componentDidMount(): void {
    this._isMounted = true;
    this._loadDoc();
  }

  componentWillUnmount(): void {
    this._isMounted = false;
  }

  componentDidUpdate(
    prevProps: Readonly<FoobarProps>,
    prevState: Readonly<State>,
    snapshot?: any
  ): void {
    if (this._isMounted) {
      this._loadDoc();
    }
  }

  async _loadDoc(): void {
    const core = getCoreStart();

    const response = await core.http.get(`${ROUTES_DOC}`, {
      query: {
        id: this.props.docId,
        index: this.props.indexId,
      },
    });
    console.log(response);

    const fields = getFieldList(response.mapping[this.props.indexId].mappings.properties);
    console.log(fields);

    if (!_.isEqual(this.state.fields, fields) || !_.isEqual(this.state.doc, response.doc._source)) {
      console.log('set state', fields);
      this.setState({
        fields,
        doc: response.doc._source,
      });
    }
  }

  _renderFormElement(name, type, value) {
    if (type === 'keyword') {
      return (
        <EuiFieldText
          value={value}
          onChange={() => {
            console.log('text');
          }}
        />
      );
    } else if (type === 'date') {
      console.log(value);
      const m = moment(value);
      console.log(m);
      return (
        <EuiDatePicker
          selected={m}
          onChange={() => {
            console.log('date change');
          }}
        />
      );
    } else {
      const s = JSON.stringify(value);
      return <>{s ? s.substring(0,100)} : s</>;
      // return <></>;
    }
  }

  _renderValues() {
    if (!this.state.fields) {
      return;
    }

    const keys = Object.keys(this.state.fields);

    const editor = keys.map((key) => {
      return (
        <EuiFlexGroup>
          <EuiFlexItem>{key}</EuiFlexItem>
          <EuiFlexItem>
            {this._renderFormElement(key, this.state.fields[key], _.get(this.state.doc, key))}
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    });
    return editor;
  }

  render() {
    return (
      <EuiFlyout
        onClose={() => {
          this.props.closeFlyout();
        }}
      >
        <EuiFlyoutHeader hasBorder aria-labelledby={'foobar'}>
          <EuiTitle>
            <h2 id={'foobar'}>Edit document</h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <p>Index:{this.props.indexId}</p>
          <p>Document: {this.props.docId}</p>
          <EuiHorizontalRule />
          {this._renderValues()}
        </EuiFlyoutBody>
        <EuiFlyoutFooter>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                iconType="cross"
                onClick={() => {
                  this.props.closeFlyout();
                }}
                flush="left"
              >
                Close
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              {' '}
              <EuiButton
                onClick={() => {
                  this.props.closeFlyout();
                }}
                fill
              >
                Save
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      </EuiFlyout>
    );
  }
}

function getFieldList(mapping): any {
  const acc = {};
  accumulateList(acc, '', mapping);
  return acc;
}

function accumulateList(acc, name, mapping) {
  const keys = Object.keys(mapping);
  keys.forEach((key) => {
    if (key === 'properties') {
      accumulateList(acc, name, mapping.properties);
    } else if (key === 'type') {
      acc[name] = mapping.type;
    } else {
      accumulateList(acc, name ? name + '.' + key : key, mapping[key]);
    }
  });
}
