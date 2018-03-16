import { uiModules } from 'ui/modules';
import { PathProvider } from 'plugins/xpack_main/services/path';
import { Telemetry } from './telemetry';
import { fetchTelemetry } from './fetch_telemetry';

function telemetryStart($injector) {
  const telemetryEnabled = $injector.get('telemetryEnabled');

  if (telemetryEnabled) {
    const Private = $injector.get('Private');
    // no telemetry for non-logged in users
    if (Private(PathProvider).isLoginOrLogout()) { return; }

    const $http = $injector.get('$http');
    const sender = new Telemetry($injector, () => fetchTelemetry($http));

    sender.start();
  }
}

uiModules.get('xpack_main/hacks').run(telemetryStart);
