export const healthToColor = health => {
  switch (health) {
    case 'green':
      return 'success';
    case 'yellow':
      return 'warning';
    case 'red':
      return 'danger';
  }
};
