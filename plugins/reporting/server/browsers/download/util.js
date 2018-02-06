/**
 * Log a message if the DEBUG environment variable is set
 * @param  {...any} args
 * @return {undefined}
 */
export function log(...args) {
  if (process.env.DEBUG) {
    console.log(...args);
  }
}

/**
 * Iterate an array asynchronously and in parallel
 * @param  {Array} array
 * @param  {Function} asyncFn
 * @return {Promise}
 */
export function asyncMap(array, asyncFn) {
  return Promise.all(array.map(asyncFn));
}

/**
 * Wait for a readable stream to end
 * @param  {Stream.Readable} stream
 * @return {Promise<undefined>}
 */
export function readableEnd(stream) {
  return new Promise((resolve, reject) => {
    stream.on('error', reject).on('end', resolve);
  });
}
