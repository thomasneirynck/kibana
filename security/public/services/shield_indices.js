import uiModules from 'ui/modules';

const module = uiModules.get('shield', []);
module.service('shieldIndices', ($http) => {
  return {
    getFieldMapping: (query) => {
      return $http.get(`../api/security/v1/mapping/${query}`)
      .then(response => response.data);
    },
    getFields: (query) => {
      return $http.get(`../api/security/v1/fields/${query}`)
      .then(response => response.data);
    },
    getIndexPatterns: () => {
      return $http.get('../api/security/v1/index_patterns')
      .then(response => response.data);
    }
  };
});
