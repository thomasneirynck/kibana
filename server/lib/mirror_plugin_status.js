export default function mirrorPluginStatus(upstreamPlugin, downstreamPlugin, ...statesToMirror) {
  if (statesToMirror.length === 0) {
    statesToMirror.push('change');
  }

  statesToMirror.map(state => upstreamPlugin.status.on(state, mirror));

  function mirror() {
    const { state, message } = upstreamPlugin.status;
    downstreamPlugin.status[state](message);
  }
  mirror(); // initial mirroring
}
