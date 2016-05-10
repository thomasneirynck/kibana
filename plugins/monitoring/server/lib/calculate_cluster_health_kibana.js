/*
 * A reduce that takes different statuses of each Kibana in a cluster and boil
 * it down into a single status
 */
export default function calculateClusterHealthKibana(set) {
  return set.reduce((result, current) => {
    if (current === 'red') return current; // change to red
    if (result !== 'green') return result; // preserve non-green
    return current; // change to green or yellow
  });
}
