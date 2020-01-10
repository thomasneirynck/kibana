/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';

import { EuiSuperSelect, EuiSpacer } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';
import { ColorStopsCategorical } from './color_stops_categorical';
import {  COLOR_PALETTES } from '../../../color_utils';


const CUSTOM_COLOR_RAMP = 'CUSTOM_COLOR_RAMP';

const customColorPalettesInputs = COLOR_PALETTES.map(palette => {
  const ramp = palette.colors.map(color => {
    const style = {
      backgroundColor: color,
      width: '10%',
      display: 'inline-block',
    };
    // eslint-disable-next-line react/no-danger
    return <div style={style} dangerouslySetInnerHTML={{ __html: '&nbsp;' }} />;
  });
  return {
    value: palette.id,
    inputDisplay: <div style={{ width: '100%', display: 'inline-block' }}>{ramp}</div>,
  };
});

export class ColorPaletteSelect extends Component {
  state = {};

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.customColorRamp !== prevState.prevPropsCustomColorRamp) {
      return {
        prevPropsCustomColorRamp: nextProps.customColorRamp, // reset tracker to latest value
        customColorRamp: nextProps.customColorRamp, // reset customColorRamp to latest value
      };
    }

    return null;
  }

  _onColorPaletteSelect = selectedValue => {
    const useCustomColorRamp = selectedValue === CUSTOM_COLOR_RAMP;
    this.props.onChange({
      color: useCustomColorRamp ? null : selectedValue,
      useCustomColorRamp,
      type: 'PALETTE',
    });
  };

  _onCustomColorPaletteChange = ({ colorStops }) => {
    this.props.onChange({
      customColorRamp: colorStops,
      type: 'PALETTE',
    });
  };

  render() {
    const {
      color,
      onChange, // eslint-disable-line no-unused-vars
      useCustomColorRamp,
      customColorRamp, // eslint-disable-line no-unused-vars
      ...rest
    } = this.props;

    let colorStopsInput;
    if (useCustomColorRamp) {
      colorStopsInput = (
        <Fragment>
          <EuiSpacer size="s" />
          <ColorStopsCategorical
            colorStops={this.state.customColorRamp}
            onChange={this._onCustomColorPaletteChange}
          />
        </Fragment>
      );
    }

    const customOption = {
      value: CUSTOM_COLOR_RAMP,
      inputDisplay: (
        <FormattedMessage
          id="xpack.maps.style.customColorPaletteLabel"
          defaultMessage="Custom color palette"
        />
      ),
    };

    const colorPaletteOptions = [customOption, ...customColorPalettesInputs];
    let valueOfSelected;
    if (useCustomColorRamp) {
      valueOfSelected = CUSTOM_COLOR_RAMP;
    } else {
      if (colorPaletteOptions.find(option => option.value === color)) {
        valueOfSelected = color;
      } else {
        valueOfSelected = customColorPalettesInputs[0].value;
      }
    }

    return (
      <Fragment>
        <EuiSuperSelect
          options={colorPaletteOptions}
          onChange={this._onColorPaletteSelect}
          valueOfSelected={valueOfSelected}
          hasDividers={true}
          {...rest}
        />
        {colorStopsInput}
      </Fragment>
    );
  }
}

ColorPaletteSelect.propTypes = {
  color: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  useCustomColorRamp: PropTypes.bool,
  customColorRamp: PropTypes.array,
};
