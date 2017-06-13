import { isEmpty } from 'lodash';
import { uiModules } from 'ui/modules';
import { Notifier } from 'ui/notify/notifier';
import template from './pipeline_edit.html';
import './pipeline_edit.less';
import 'ace';

const app = uiModules.get('xpack/logstash');

app.directive('pipelineEdit', function ($injector) {
  const pipelineService = $injector.get('pipelineService');
  const shieldUser = $injector.get('ShieldUser');
  const kbnUrl = $injector.get('kbnUrl');
  const confirmModal = $injector.get('confirmModal');

  return {
    restrict: 'E',
    template: template,
    scope: {
      pipeline: '='
    },
    bindToController: true,
    controllerAs: 'pipelineEdit',
    controller: class PipelineEditController {
      constructor($scope) {
        this.notifier = new Notifier({ location: 'Logstash' });
        this.isNewPipeline = isEmpty(this.pipeline.id);
        $scope.user = shieldUser.getCurrent();
        $scope.aceLoaded = (editor) => {
          this.editor = editor;
          editor.getSession().setMode("ace/mode/ruby");
          editor.$blockScrolling = Infinity;
        };
      }

      onPipelineSave = (username) => {
        this.pipeline.username = username;
        return pipelineService.savePipeline(this.pipeline)
        .then(() => {
          this.notifier.info(`Saved pipeline "${this.pipeline.id}"`);
          this.close();
        })
        .catch(e => {
          this.notifier.error(e);
        });
      }

      onPipelineDelete = () => {
        const confirmModalOptions = {
          onConfirm: this.deletePipeline,
          confirmButtonText: 'Delete pipeline'
        };

        return confirmModal('This will permanently delete the pipeline. Are you sure?', confirmModalOptions);
      }

      onClose = () => {
        kbnUrl.change('/management/logstash/pipelines', {});
      }

      deletePipeline = () => {
        return pipelineService.deletePipeline(this.pipeline.id)
        .then(() => {
          this.notifier.info(`Deleted pipeline "${this.pipeline.id}"`);
          this.close();
        })
        .catch(e => {
          this.notifier.error(e);
        });
      }

      close = () => {
        kbnUrl.change('/management/logstash/pipelines', {});
      }

      get isSaveEnabled() {
        return !(this.form.$invalid || this.jsonForm.$invalid);
      }
    }
  };
});
