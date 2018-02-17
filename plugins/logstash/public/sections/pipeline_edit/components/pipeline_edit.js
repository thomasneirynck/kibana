import { isEmpty } from 'lodash';
import { uiModules } from 'ui/modules';
import { InitAfterBindingsWorkaround } from 'ui/compat';
import { Notifier, toastNotifications } from 'ui/notify';
import 'ui/dirty_prompt';
import template from './pipeline_edit.html';
import 'plugins/logstash/services/license';
import 'plugins/logstash/services/security';
import './pipeline_edit.less';
import 'ace';

const app = uiModules.get('xpack/logstash');

app.directive('pipelineEdit', function ($injector) {
  const pipelineService = $injector.get('pipelineService');
  const licenseService = $injector.get('logstashLicenseService');
  const securityService = $injector.get('logstashSecurityService');
  const kbnUrl = $injector.get('kbnUrl');
  const confirmModal = $injector.get('confirmModal');
  const dirtyPrompt = $injector.get('dirtyPrompt');

  return {
    restrict: 'E',
    template: template,
    scope: {
      pipeline: '='
    },
    bindToController: true,
    controllerAs: 'pipelineEdit',
    controller: class PipelineEditController extends InitAfterBindingsWorkaround {
      initAfterBindings($scope) {
        this.originalPipeline = { ...this.pipeline };
        this.notifier = new Notifier({ location: 'Logstash' });
        this.isNewPipeline = isEmpty(this.pipeline.id);
        // only if security is enabled and available, we tack on the username.
        if (securityService.isSecurityEnabled) {
          $scope.user = $injector.get('ShieldUser').getCurrent();
        } else {
          $scope.user = null;
        }
        $scope.aceLoaded = (editor) => {
          this.editor = editor;
          editor.setReadOnly(this.isReadOnly);
          editor.getSession().setMode("ace/mode/ruby");
          editor.setOptions({
            minLines: 25,
            maxLines: Infinity
          });
          editor.$blockScrolling = Infinity;
        };
        if (this.isReadOnly) {
          toastNotifications.addWarning(licenseService.message);
        }

        dirtyPrompt.register(() => !this.pipeline.isEqualTo(this.originalPipeline));
        $scope.$on('$destroy', dirtyPrompt.deregister);
      }

      onPipelineSave = (username) => {
        this.pipeline.username = username;
        return pipelineService.savePipeline(this.pipeline)
          .then(() => {
            toastNotifications.addSuccess(`Saved '${this.pipeline.id}'`);
            this.close();
          })
          .catch(err => {
            return licenseService.checkValidity()
              .then(() => this.notifier.error(err));
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
        this.close();
      }

      deletePipeline = () => {
        return pipelineService.deletePipeline(this.pipeline.id)
          .then(() => {
            toastNotifications.addSuccess(`Deleted '${this.pipeline.id}'`);
            this.close();
          })
          .catch(err => {
            return licenseService.checkValidity()
              .then(() => this.notifier.error(err));
          });
      }

      close = () => {
        dirtyPrompt.deregister();
        kbnUrl.change('/management/logstash/pipelines', {});
      }

      get isSaveEnabled() {
        return !(this.form.$invalid || this.jsonForm.$invalid);
      }

      get isReadOnly() {
        return licenseService.isReadOnly;
      }
    }
  };
});
