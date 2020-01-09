/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import _ from 'lodash';
import React, { Fragment } from 'react';
import { FieldSelect } from '../field_select';
import { ColorRampSelect } from './color_ramp_select';
import { ColorPaletteSelect } from './color_palette_select';
import { EuiFlexGroup, EuiFlexItem, EuiSpacer } from '@elastic/eui';
import { RAMP_TYPE } from './ramp_type';

export class DynamicColorForm extends React.Component {
  state = {
    rampType: RAMP_TYPE.COLOR_RAMP,
  };

  constructor() {
    super();
    this._isMounted = false;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
    this._loadRampType();
  }

  componentDidUpdate() {
    this._loadRampType();
  }

  async _loadRampType() {
    const field = this.props.styleProperty.getField();
    const dataType = await field.getDataType();
    const rampType = dataType === 'string' ? RAMP_TYPE.COLOR_PALETTE : RAMP_TYPE.COLOR_RAMP;
    if (this._isMounted && this.state.rampType !== rampType) {
      this.setState({ rampType: rampType });
    }
  }

  _getColorSelector() {
    const { onDynamicStyleChange, styleProperty } = this.props;
    const styleOptions = styleProperty.getOptions();

    let colorSelect;
    if (styleOptions.field && styleOptions.field.name) {
      const onColorChange = colorOptions => {
        onDynamicStyleChange(styleProperty.getStyleName(), {
          ...styleOptions,
          ...colorOptions,
        });
      };
      if (this.state.rampType === RAMP_TYPE.COLOR_RAMP) {
        colorSelect = (
          <ColorRampSelect
            onChange={options => onColorChange(options)}
            color={styleOptions.color}
            customColorRamp={styleOptions.customColorRamp}
            useCustomColorRamp={_.get(styleOptions, 'useCustomColorRamp', false)}
            compressed
          />
        );
      } else {
        colorSelect = (
          <ColorPaletteSelect
            onChange={options => onColorChange(options)}
            color={styleOptions.color}
            customColorRamp={styleOptions.customColorRamp}
            useCustomColorRamp={_.get(styleOptions, 'useCustomColorRamp', false)}
            compressed
          />
        );
      }
      return colorSelect;
    }
  }

  render() {
    const { fields, onDynamicStyleChange, staticDynamicSelect, styleProperty } = this.props;
    const styleOptions = styleProperty.getOptions();
    const onFieldChange = ({ field }) => {
      onDynamicStyleChange(styleProperty.getStyleName(), { ...styleOptions, field });
    };

    const colorSelect = this._getColorSelector();

    return (
      <Fragment>
        <EuiFlexGroup gutterSize="none" justifyContent="flexEnd">
          <EuiFlexItem grow={false}>{staticDynamicSelect}</EuiFlexItem>
          <EuiFlexItem>
            <FieldSelect
              fields={fields}
              selectedFieldName={_.get(styleOptions, 'field.name')}
              onChange={onFieldChange}
              compressed
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        {colorSelect}
      </Fragment>
    );
  }
}
