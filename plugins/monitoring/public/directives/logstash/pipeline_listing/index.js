import React from 'react';
import { render } from 'react-dom';
import { PipelineCardGroup } from 'plugins/monitoring/components/logstash/pipeline_card_group';
import { uiModules } from 'ui/modules';

const uiModule = uiModules.get('monitoring/directives', []);
uiModule.directive('monitoringLogstashPipelineListing', function ($injector) {
  const kbnUrl = $injector.get('kbnUrl');

  return {
    restrict: 'E',
    scope: {
      pipelines: '=',
      upgradeMessage: '@'
    },
    link(scope, $el) {
      function onHashClick(id, hash) {
        const url = `/logstash/pipelines/${id}/${hash}`;
        scope.$evalAsync(() => kbnUrl.changePath(url));
      }

      scope.$watch('pipelines', pipelines => {
        const pipelineCardGroup = (
          <PipelineCardGroup
            pipelines={ pipelines }
            onHashClick={ onHashClick }
            upgradeMessage={ scope.upgradeMessage }
          />
        );

        render(pipelineCardGroup, $el[0]);
      });
    }
  };
});
