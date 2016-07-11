import opsBuffer from './lib/ops_buffer';

export default function (serverInfo, server) {
  const config = server.config();

  if (config.get('xpack.monitoring.kibana.collection.enabled')) {
    const buffer = opsBuffer(serverInfo, server);
    const monitor = server.plugins['even-better'].monitor;
    let opsHandler;

    function onOps(event) {
      buffer.push(event);
    }

    server.plugins.elasticsearch.status.on('green', () => {
      monitor.on('ops', onOps);
      opsHandler = setInterval(() => buffer.flush(), config.get('xpack.monitoring.kibana.collection.interval'));
    });

    server.plugins.elasticsearch.status.on('red', () => {
      monitor.removeListener('ops', onOps);
      clearInterval(opsHandler);
    });
  }
}
