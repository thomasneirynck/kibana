export default function mirrorPluginStatus(upstreamPlugin, downstreamPlugin, ...statesToMirror) {

  function mirror(previousState, previousMsg, newState, newMsg) {
    downstreamPlugin.status[newState](newMsg);
  }

  if (statesToMirror.length === 0) {
    statesToMirror.push('change');
  }

  statesToMirror.map(state => upstreamPlugin.status.on(state, mirror));
  mirror(); // initial mirroring
}
