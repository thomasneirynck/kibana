/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import tinycolor from 'tinycolor2';
import chroma from 'chroma-js';
import { euiPaletteColorBlind } from '@elastic/eui/lib/services';
import { ColorGradient } from './components/color_gradient';
import { COLOR_PALETTE_MAX_SIZE } from '../../../common/constants';
import { vislibColorMaps } from '../../../../../../../src/plugins/charts/public';

export const GRADIENT_INTERVALS = 8;

export const DEFAULT_FILL_COLORS = euiPaletteColorBlind();
export const DEFAULT_LINE_COLORS = [
  ...DEFAULT_FILL_COLORS.map(color =>
    tinycolor(color)
      .darken()
      .toHexString()
  ),
  // Explicitly add black & white as border color options
  '#000',
  '#FFF',
];

function getLegendColors(colorRamp, numLegendColors) {
  const colors = [];
  colors[0] = getColorRgbString(colorRamp, 0);
  for (let i = 1; i < numLegendColors - 1; i++) {
    colors[i] = getColorRgbString(colorRamp, Math.floor((colorRamp.length * i) / numLegendColors));
  }
  colors[numLegendColors - 1] = getColorRgbString(colorRamp, colorRamp.length - 1);
  return colors;
}

function getColorRgbString(colorRamp, i) {
  const color = colorRamp[i][1];
  const red = Math.floor(color[0] * 255);
  const green = Math.floor(color[1] * 255);
  const blue = Math.floor(color[2] * 255);
  return `rgb(${red},${green},${blue})`;
}

function getColorRamp(colorRampName) {
  const colorRamp = vislibColorMaps[colorRampName];
  if (!colorRamp) {
    throw new Error(
      `${colorRampName} not found. Expected one of following values: ${Object.keys(
        vislibColorMaps
      )}`
    );
  }
  return colorRamp;
}

export function getRGBColorRangeStrings(colorRampName, numberColors) {
  const colorRamp = getColorRamp(colorRampName);
  return getLegendColors(colorRamp.value, numberColors);
}

export function getHexColorRangeStrings(colorRampName, numberColors) {
  return getRGBColorRangeStrings(colorRampName, numberColors).map(rgbColor =>
    chroma(rgbColor).hex()
  );
}

export function getColorRampCenterColor(colorRampName) {
  if (!colorRampName) {
    return null;
  }
  const colorRamp = getColorRamp(colorRampName);
  const centerIndex = Math.floor(colorRamp.value.length / 2);
  return getColorRgbString(colorRamp.value, centerIndex);
}

// Returns an array of color stops
// [ stop_input_1: number, stop_output_1: color, stop_input_n: number, stop_output_n: color ]
export function getOrdinalMbColorRampStops(colorRampName, min, max, numberColors) {
  if (!colorRampName) {
    return null;
  }

  if (min > max) {
    return null;
  }

  const hexColors = getHexColorRangeStrings(colorRampName, numberColors);
  if (max === min) {
    //just return single stop value
    return [max, hexColors[hexColors.length - 1]];
  }

  const delta = max - min;
  return hexColors.reduce((accu, stopColor, idx, srcArr) => {
    const stopNumber = min + (delta * idx) / srcArr.length;
    return [...accu, stopNumber, stopColor];
  }, []);
}

export function getOrdinalColorRampStopsForLegend(
  colorRampName,
  min,
  max,
  mapNumberColors,
  legendNumberOfColors
) {
  const colorRampForTheMap = getOrdinalMbColorRampStops(colorRampName, min, max, mapNumberColors);
  if (!colorRampForTheMap) {
    return null;
  }

  console.log(colorRampForTheMap);

  if (colorRampForTheMap.length / 2 <= legendNumberOfColors) {
    //return the map legend
    const stops = [];
    for (let j = 0; j < colorRampForTheMap.length; j += 2) {
      stops.push({
        stop: colorRampForTheMap[j],
        color: colorRampForTheMap[j + 1],
        mb: true,
      });
    }
    return stops;
  }

  console.log('need to rescale the deltas!');

  const stops = [];
  const delta = max - min;
  for (let j = 0; j < legendNumberOfColors; j++) {
    console.log('--------');
    const legendScaleFactor = j / legendNumberOfColors;

    console.log(j, legendScaleFactor);

    const fromIndex = Math.max(0, Math.floor(legendScaleFactor * mapNumberColors));
    const toIndex = fromIndex + 1;
    console.log('index', fromIndex, toIndex);
    const fromColor = colorRampForTheMap[fromIndex * 2 + 1];
    const fromStop = colorRampForTheMap[fromIndex * 2];
    const toColor = colorRampForTheMap[toIndex * 2 + 1];
    const toStop = colorRampForTheMap[toIndex * 2];

    console.log('stops - colors', fromColor, toColor);

    const stop = min + (delta * j) / legendNumberOfColors;

    console.log('stops', fromStop, stop, toStop);
    const scaleFactor = (stop - fromStop) / (toStop - fromStop);

    console.log('scalefactor', scaleFactor);
    const scale = chroma.scale([fromColor, toColor]);
    const color = scale(scaleFactor).hex(); // #FF7F7F
    console.log('scalefactor', fromColor, toColor, scaleFactor, color);

    const from = '#2070b4';
    const interolated = '#165697';
    const to = '#072f6b';

    if (!stops.length || stops[stops.length - 1].stop !== fromStop) {
      stops.push({stop: fromStop, color: fromColor, mb: true});
    }
    stops.push({ stop, color });
    stops.push({ stop: toStop, color: toColor , mb: true});
  }

  console.log(stops);
  return stops;

  // const stops = [];
  // for (let j = 0; j < colorRampForTheMap.length; j += 2) {
  //   stops.push({
  //     stop: colorRampForTheMap[j],
  //     color: colorRampForTheMap[j + 1],
  //   });
  // }
  // return stops;
}

//
// export function getColorRampScaleForLegend(colorRampName, min, max, numberColorsOnMap, numberColorsOn) {
//
//   const scale = chroma.scale(['white', 'red']);
//   scale(0.5).hex(); // #FF7F7F
//
// }

export const COLOR_GRADIENTS = Object.keys(vislibColorMaps).map(colorRampName => ({
  value: colorRampName,
  inputDisplay: <ColorGradient colorRampName={colorRampName} />,
}));

export const COLOR_RAMP_NAMES = Object.keys(vislibColorMaps);

export function getLinearGradient(colorStrings) {
  const intervals = colorStrings.length;
  let linearGradient = `linear-gradient(to right, ${colorStrings[0]} 0%,`;
  for (let i = 1; i < intervals - 1; i++) {
    linearGradient = `${linearGradient} ${colorStrings[i]} \
      ${Math.floor((100 * i) / (intervals - 1))}%,`;
  }
  return `${linearGradient} ${colorStrings[colorStrings.length - 1]} 100%)`;
}

const COLOR_PALETTES_CONFIGS = [
  {
    id: 'palette_0',
    colors: DEFAULT_FILL_COLORS.slice(0, COLOR_PALETTE_MAX_SIZE),
  },
];

export function getColorPalette(paletteId) {
  const palette = COLOR_PALETTES_CONFIGS.find(palette => palette.id === paletteId);
  return palette ? palette.colors : null;
}

export const COLOR_PALETTES = COLOR_PALETTES_CONFIGS.map(palette => {
  const paletteDisplay = palette.colors.map(color => {
    const style = {
      backgroundColor: color,
      width: '10%',
      position: 'relative',
      height: '100%',
      display: 'inline-block',
    };
    return (
      <div style={style} key={color}>
        &nbsp;
      </div>
    );
  });
  return {
    value: palette.id,
    inputDisplay: <div className={'mapColorGradient'}>{paletteDisplay}</div>,
  };
});
