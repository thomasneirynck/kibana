/* eslint-env jest */

function $() {
  return {
    on: jest.fn(),
    off: jest.fn()
  };
}

$.plot = () => ({
  shutdown: jest.fn()
});

module.exports = $;
