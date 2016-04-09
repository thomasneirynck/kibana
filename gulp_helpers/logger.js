module.exports = function logger() {
  var DEBUG = process.env.DEBUG || false;

  if (!DEBUG) return;
  console.log.apply(console, arguments);
};