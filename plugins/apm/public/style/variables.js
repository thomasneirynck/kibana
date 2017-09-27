// Units
export const unit = 16;

export const units = {
  unit,
  eighth: unit / 8,
  quarter: unit / 4,
  half: unit / 2,
  minus: unit * 0.75,
  plus: unit * 1.5,
  double: unit * 2,
  triple: unit * 3,
  quadruple: unit * 4
};

export function px(value) {
  return `${value}px`;
}

export function pct(value) {
  return `${value}%`;
}

// Styling
export const borderRadius = '5px';

// Colors (from dark to light)
const colorBlue1 = '#006E8A';
const colorBlue2 = '#0079a5';
export const colors = {
  black: '#000000',
  black2: '#2d2d2d',
  gray1: '#3f3f3f',
  gray2: '#666666',
  gray3: '#999999',
  gray4: '#d9d9d9',
  gray5: '#f5f5f5',
  white: '#ffffff',
  teal: '#00a69b',
  red: '#a30000',
  yellow: '#FFF7EB',
  blue1: colorBlue1,
  blue2: colorBlue2,

  // Semantic colors
  link: colorBlue2,
  linkHover: colorBlue1
};

// Fonts
export const fontFamily = '"Open Sans", Helvetica, Arial, sans-serif';
export const fontFamilyCode = 'Inconsolata, monospace, serif';

// Font sizes
export const fontSize = '14px';

export const fontSizes = {
  tiny: '10px',
  small: '12px',
  large: '16px',
  xlarge: '20px',
  xxlarge: '30px'
};
