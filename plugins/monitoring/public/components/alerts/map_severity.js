import { capitalize } from 'lodash';

export function mapSeverity(severity) {
  const floor = Math.floor((severity + 1) / 1000);
  const value = (() => {
    switch (floor) {
      case -1: return 'ok';
      case 0: return 'low';
      case 1: return 'medium';
      default: return 'high';
    }
  })();
  const humanized = `${capitalize(value)} severity alert`;

  return { value, humanized };
}

export function mapSeverityColor(severity) {
  const floor = Math.floor((severity + 1) / 1000);
  switch (floor) {
    case -1: return 'success';
    case 0: return 'primary';
    case 1: return 'warning';
    default: return 'danger';
  }
}
