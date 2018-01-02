const path = require('path');
const simpleGit = require('simple-git');

exports.getFiles = function filesToCommit(filePath) {
  const gitPath = path.resolve(__dirname, '..');
  const relativePath = path.relative(gitPath, filePath);
  const fileMatch = new RegExp(`^${relativePath}`);

  const options = ['--name-status', '--cached'];
  const git = simpleGit(gitPath);

  return new Promise((resolve, reject) => {
    git.diff(options, (err, output) => {
      if (err) return reject(err);
      resolve(output);
    });
  })
    .then(output => {
      return output
        .split('\n')
        .filter(line => line.trim().length > 0) // Ignore blank lines
        .map(line => line.trim().split('\t'))
        .map(parts => {
          const status = parts[0];
          // If a file's been edited, it will only have 2 elements. If it's been renamed it will have
          // 3 elements. But in both cases, the last element is the current name of the file.
          const name = parts[parts.length - 1];
          return { status, name };
        })
        .filter(file => file.status !== 'D') // Ignore deleted files
        .filter(file => fileMatch.test(exports.getFilename(file)));
    });
};

exports.getFilename = function getFilename(file) {
  return file.name;
};

exports.isAdded = function isAdded(file) {
  return file.status === 'A';
};

exports.isDeleted = function isDeleted(file) {
  return file.status === 'D';
};

exports.isUnmerged = function isUnmerged(file) {
  return file.status === 'U';
};

exports.isStaged = function isStaged(file) {
  return !exports.isDeleted(file) && !exports.isUnmerged(file);
};
