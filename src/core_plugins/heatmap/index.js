export default function (kibana) {
  console.log('loading heatmap');
  return new kibana.Plugin({
    uiExports: {
      visTypes: ['plugins/heatmap/heatmap']
    }
  });
};
