import { isAbsolute } from 'path';
import { statSync } from 'fs';

import { sortBy } from 'lodash';
import glob from 'glob';

/**
 *  Find the most recently modified file that matches the pattern pattern
 *
 *  @param  {String} pattern absolute path with glob expressions
 *  @return {String} Absolute path
 */
export function findMostRecentlyChanged(pattern) {
  if (!isAbsolute(pattern)) {
    throw new TypeError(`Pattern must be absolute, got ${pattern}`);
  }

  return sortBy(glob.sync(pattern), path => statSync(path).ctime).shift();
}
