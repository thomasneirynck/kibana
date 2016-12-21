module.exports = function logger() {
  const DEBUG = process.env.DEBUG || false;

  if (!DEBUG) return;
  console.log.apply(console, arguments);
};