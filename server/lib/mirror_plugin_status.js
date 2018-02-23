export function mirrorPluginStatus(upstreamPlugin, downstreamPlugin, ...statesToMirror) {
  upstreamPlugin.status.setMaxListeners(20); // We need more than the default, which is 10

  function mirror(previousState, previousMsg, newState, newMsg) {
    if (newState) {
      downstreamPlugin.status[newState](newMsg);
    }
  }

  if (statesToMirror.length === 0) {
    statesToMirror.push('change');
  }

  statesToMirror.map(state => upstreamPlugin.status.on(state, mirror));
  mirror(null, null, upstreamPlugin.status.state, upstreamPlugin.status.message); // initial mirroring
}
