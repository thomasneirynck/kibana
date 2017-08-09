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
      "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$":`${kibanaDirectory}/src/jest/file_mock.js`,
      "\\.(css|less|scss)$": `${kibanaDirectory}/src/jest/style_mock.js`
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
