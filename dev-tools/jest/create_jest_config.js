export function createJestConfig({
  kibanaDirectory,
  xPackKibanaDirectory,
}) {
  return {
    rootDir: xPackKibanaDirectory,
    roots: [
      "<rootDir>/plugins",
    ],
    moduleFileExtensions: [
      "js",
      "json"
    ],
    moduleNameMapper: {
      "^ui_framework/components": `${kibanaDirectory}/ui_framework/components`,
      "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": `${kibanaDirectory}/src/dev/jest/file_mock.js`,
      "\\.(css|less|scss)$": `${kibanaDirectory}/src/dev/jest/mocks/style_mock.js`
    },
    setupFiles: [
      `${kibanaDirectory}/src/dev/jest/setup/babel_polyfill.js`,
    ],
    testMatch: [
      "**/*.test.js"
    ],
    transform: {
      "^.+\\.js$": `${kibanaDirectory}/src/dev/jest/babel_transform.js`
    },
    transformIgnorePatterns: [
      "[/\\\\]node_modules[/\\\\].+\\.js$"
    ],
    snapshotSerializers: [
      `${kibanaDirectory}/node_modules/enzyme-to-json/serializer`
    ],
    "reporters": [
      "default",
      [`${kibanaDirectory}/src/dev/jest/junit_reporter.js`, {
        reportName: 'X-Pack Jest Tests',
        rootDirectory: xPackKibanaDirectory,
      }]
    ]
  };
}
