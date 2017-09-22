import { tableStorageGetter, tableStorageSetter } from './storage';

export class MonitoringTableBaseController {

  constructor({ title = '', storageKey, getPageData, $injector, $scope }) {
    const titleService = $injector.get('title');
    titleService($scope.cluster, title);

    $injector.get('timefilter').enabled = true;

    const getLocalStorageData = tableStorageGetter(storageKey);
    const setLocalStorageData = tableStorageSetter(storageKey);
    const storage = $injector.get('localStorage');
    const { pageIndex, filterText, sortKey, sortOrder } = getLocalStorageData(storage);

    this.pageIndex = pageIndex;
    this.filterText = filterText;
    this.sortKey = sortKey;
    this.sortOrder = sortOrder;

    this.onNewState = newState => {
      setLocalStorageData(storage, newState);
    };

    this.updateData = () => {
      return getPageData($injector).then(pageData => this.data = pageData);
    };

    const $executor = $injector.get('$executor');
    $executor.register({
      execute: () => this.updateData()
    });
    $executor.start();
    $scope.$on('$destroy', $executor.destroy);
  }

}
