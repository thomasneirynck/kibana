export default function mirrorPluginStatus(upstreamPlugin, downstreamPlugin, ...statesToMirror) {

  function mirror() {
    const { state, message } = upstreamPlugin.status;
    downstreamPlugin.status[state](message);
  }

  if (statesToMirror.length === 0) {
    statesToMirror.push('change');
  }

  statesToMirror.map(state => upstreamPlugin.status.on(state, mirror));
  mirror(); // initial mirroring
}
