import opsBuffer from './lib/ops_buffer';

export default function (serverInfo, server) {
  const monitor = server.plugins['even-better'].monitor;
  const config = server.config();
  const buffer = opsBuffer(serverInfo, server);
  let opsHandler;
  server.plugins.elasticsearch.status.on('green', () => {
    monitor.on('ops', onOps);
    opsHandler = setInterval(() => buffer.flush(), config.get('xpack.monitoring.kibana_flush_interval'));
  });

  server.plugins.elasticsearch.status.on('red', () => {
    monitor.removeListener('ops', onOps);
    clearInterval(opsHandler);
  });

  function onOps(event) {
    buffer.push(event);
  }
}
