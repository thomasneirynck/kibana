export default function getClass(status) {
  if (status === 'green') return 'fa fa-check';
  if (status === 'yellow') return 'fa fa-warning';
  return 'fa fa-bolt';
};
