import {
  getFromApi,
} from '../request';


export async function getDeprecations() {
  return await getFromApi(`/api/migration/deprecations`);
}
