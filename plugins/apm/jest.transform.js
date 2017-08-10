/* eslint-disable import/no-extraneous-dependencies */
// I would prefer just having a .babelrc file, but Kibana will also read it, and complain about missing dependencies (even though they exist).
// It will hopefully be possible to simplify when the new platform is ready, where plugins can be developed independently

module.exports = require('babel-jest').createTransformer({
  presets: [
    'react',
    [
      'env',
      {
        targets: {
          browsers: ['last 2 versions', 'safari >= 7']
        }
      }
    ],
    {
      plugins: ['transform-runtime']
    }
  ],
  plugins: ['transform-class-properties', 'transform-object-rest-spread']
});
