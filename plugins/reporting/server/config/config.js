const os = require('os');
const defaultCPUCount = 2;

function cpuCount() {
  try {
    return os.cpus().length;
  } catch (e) {
    return defaultCPUCount;
  }
};

module.exports = {
  concurrency: cpuCount()
};
