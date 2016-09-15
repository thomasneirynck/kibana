export default function MockWindowProvider() {
  let items = {};
  return {
    sessionStorage: {
      setItem(key, value) {
        items[key] = value;
      },
      getItem(key) {
        return items[key];
      },
      removeItem(key) {
        delete items[key];
      }
    }
  };
}
