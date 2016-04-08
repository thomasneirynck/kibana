export default {
  toggle(collection, item) {
    const i = collection.indexOf(item);
    if (i >= 0) collection.splice(i, 1);
    else collection.push(item);
  }
};
