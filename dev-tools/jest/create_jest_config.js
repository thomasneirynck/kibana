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
    },
    testMatch: [
      "**/*.test.js"
    ],
    transform: {
      "^.+\\.js$": `${kibanaDirectory}/src/jest/babelTransform.js`
    },
    transformIgnorePatterns: [
      "[/\\\\]node_modules[/\\\\].+\\.js$"
    ],
    snapshotSerializers: [
      `${kibanaDirectory}/node_modules/enzyme-to-json/serializer`
    ]
  };
}
