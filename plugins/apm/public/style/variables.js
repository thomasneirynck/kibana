// Units
export const unit = 16;

export const units = {
  unit,
  eight: unit / 8,
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

// Colors
export const colors = {
  linkColor: '#0079a5',
  elementBorder: '#dce0e5',
  elementBorderDark: '#bababa',
  elementBackground: '#fff',
  elementBackgroundDark: '#f5f5f5',
  tableBorder: '#E9E9E9',
  tableHeaderColor: '#bdbdbd',
  impactBar: '#0079a5',
  impactBarBackground: '#d9d9d9'
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
