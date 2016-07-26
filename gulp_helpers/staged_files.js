const SimpleGit = require('simple-git');

exports.getFiles = function filesToCommit(path) {
  const options = ['--name-status', '--cached'];
  const simpleGit = new SimpleGit(path);

  return new Promise((resolve, reject) => {
    simpleGit.diff(options, (err, output) => {
      if (err) return reject(err);
      resolve(output);
    });
  })
  .then(output => {
    return output
    .split('\n')
    .map(line => line.trim().split('\t'))
    .filter(parts => parts.length === 2)
    .map(parts => {
      const status = parts.shift();
      const name = parts.join('\t').trim();
      return { status, name };
    });
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
