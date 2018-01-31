export const filterItems = (fields, filter = '', items = []) => {
  const lowerFilter = filter.toLowerCase();
  return items.filter(item => {
    const actualFields = fields || Object.keys(item);
    const indexOfMatch = actualFields.findIndex(field => {
      const normalizedField = String(item[field]).toLowerCase();
      return normalizedField.includes(lowerFilter);
    });
    return indexOfMatch !== -1;
  });
};
