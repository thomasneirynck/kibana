import pluralize from 'pluralize';
import { uiModules } from 'ui/modules';
import { Notifier } from 'ui/notify/notifier';
import template from './pipeline_list.html';
import '../pipeline_table';
import { PAGINATION } from 'plugins/logstash/../common/constants';
import 'ui/pager_control';
import 'ui/pager';
import 'ui/react_components';
import 'ui/table_info';
import 'plugins/logstash/services/pipelines';

const app = uiModules.get('xpack/logstash');

app.directive('pipelineList', function ($injector) {
  const pagerFactory = $injector.get('pagerFactory');
  const pipelinesService = $injector.get('pipelinesService');
  const confirmModal = $injector.get('confirmModal');

  const $filter = $injector.get('$filter');
  const filter = $filter('filter');
  const orderBy = $filter('orderBy');
  const limitTo = $filter('limitTo');

  return {
    restrict: 'E',
    template: template,
    scope: {},
    controllerAs: 'pipelineList',
    controller: class PipelineListController {
      constructor($scope) {
        this.isForbidden = true;
        this.isLoading = true;
        this.pipelines = [];
        this.selectedPipelines = [];
        this.pageOfPipelines = [];
        this.sortField = 'status.sortOrder';
        this.sortReverse = false;

        this.notifier = new Notifier({ location: 'Logstash' });
        this.pager = pagerFactory.create(this.pipelines.length, PAGINATION.PAGE_SIZE, 1);

        // load pipelines
        this.loadPipelines();

        // react to pipeline and ui changes
        $scope.$watchMulti([
          'pipelineList.pipelines',
          'pipelineList.sortField',
          'pipelineList.sortReverse',
          'pipelineList.query',
          'pipelineList.pager.currentPage'
        ], this.applyFilters);
      }

      handleError(err) {
        const statusCode = err.data.statusCode;
        console.log(statusCode);
        if (statusCode === 403) {
          this.isLoading = false;
          this.isForbidden = true;
          return;
        }
        this.isForbidden = false;
        this.notifier.error(err);
      }

      loadPipelines = () => {
        pipelinesService.getPipelineList()
        .then(pipelines => {
          this.isLoading = false;
          this.isForbidden = false;
          this.pipelines = pipelines;
        })
        .catch(err => this.handleError(err));
      }

      get hasPageOfPipelines() {
        return this.pageOfPipelines.length > 0;
      }

      get hasSelectedPipelines() {
        return this.selectedPipelines.length > 0;
      }

      onQueryChange = (query) => {
        this.query = query;
      };

      onPageNext = () => {
        this.pager.nextPage();
      };

      onPagePrevious = () => {
        this.pager.previousPage();
      };

      onSortChange = (field, reverse) => {
        this.sortField = field;
        this.sortReverse = reverse;
      };

      onSelectedPipelinesDelete = () => {
        const numPipelinesToDelete = this.selectedPipelines.length;
        const pipelinesStr = pluralize('Pipeline', numPipelinesToDelete);

        const confirmModalText = `This will permanently delete ${numPipelinesToDelete} ${pipelinesStr}. Are you sure?`;
        const confirmButtonText = `Delete ${numPipelinesToDelete} ${pipelinesStr}`;

        const confirmModalOptions = {
          confirmButtonText,
          onConfirm: this.deleteSelectedPipelines
        };

        return confirmModal(confirmModalText, confirmModalOptions);
      };

      deleteSelectedPipelines = () => {
        const numPipelinesToDelete = this.selectedPipelines.length;
        const pipelinesStr = pluralize('Pipeline', numPipelinesToDelete);

        const pipelineIds = this.selectedPipelines.map(pipeline => pipeline.id);
        return pipelinesService.deletePipelines(pipelineIds)
        .then(results => {
          const numSuccesses = results.numSuccesses;
          const numErrors = results.numErrors;
          const numTotal = this.selectedPipelines.length;

          if (numSuccesses > 0) {
            this.notifier.info(`Deleted ${numSuccesses} out of ${numTotal} selected ${pipelinesStr}`);
          }

          if (numErrors > 0) {
            this.notifier.error(`Could not delete ${numErrors} out of ${numTotal} selected ${pipelinesStr}`);
          }

          this.loadPipelines();
        });
      }

      onSelectedChange = (selectedPipelines) => {
        this.selectedPipelines = selectedPipelines;
      };

      applyFilters = () => {
        let filteredPipelines = this.pipelines;
        let pageOfPipelines = [];

        filteredPipelines = filter(filteredPipelines, { searchValue: this.query });
        filteredPipelines = orderBy(filteredPipelines, this.sortField, this.sortReverse);
        pageOfPipelines = limitTo(filteredPipelines, this.pager.pageSize, this.pager.startIndex);

        this.pageOfPipelines = pageOfPipelines;
        this.pager.setTotalItems(filteredPipelines.length);
      };
    }
  };
});
