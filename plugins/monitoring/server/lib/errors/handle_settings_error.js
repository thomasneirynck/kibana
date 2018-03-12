import { wrap } from 'boom';

export function handleSettingsError(err) {
  return wrap(err, err.statusCode);
}
