import fs from 'fs';
import crypto from 'crypto';
import expect from 'expect.js';
import extract from '../../../server/lib/extract';

const FIXTURES_FOLDER = `${__dirname}/../../fixtures`;
const SRC_FILE_UNCOMPRESSED = `${FIXTURES_FOLDER}/extract_test_file.js`;
const EXTRACT_TARGET_FOLDER = `${FIXTURES_FOLDER}/extract_target`;
const EXTRACT_TARGET_FILE = `${EXTRACT_TARGET_FOLDER}/extract_test_file.js`;

function cleanup(done) {

  const deleteFolder = () => fs.rmdir(EXTRACT_TARGET_FOLDER, done);

  fs.stat(EXTRACT_TARGET_FOLDER, folderDoesNotExist => {
    if (folderDoesNotExist) return done();

    fs.stat(EXTRACT_TARGET_FILE, fileDoesNotExist => {
      if (fileDoesNotExist) return deleteFolder();

      fs.unlink(EXTRACT_TARGET_FILE, deleteFolder);
    });
  });
}

function fileHash(filepath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const input = fs.createReadStream(filepath);
    input.on('readable', () => {
      const data = input.read();
      if (data) {
        hash.update(data);
      } else {
        resolve(hash.digest('hex'));
      }
    });
    input.on('error', reject);
  });
}

describe('extract', () => {

  beforeEach(cleanup);
  afterEach(cleanup);

  describe('zip()', () => {
    it('throws an Error given a non-zip file', async () => {
      let thrownException;
      try {
        await extract.zip(SRC_FILE_UNCOMPRESSED, EXTRACT_TARGET_FOLDER);
      } catch (e) {
        thrownException = e;
      }

      expect(thrownException).to.be.an(Error);
    });

    it('successfully extracts a valid zip file to the given target', async () => {
      const srcFileCompressed = `${SRC_FILE_UNCOMPRESSED}.zip`;
      await extract.zip(srcFileCompressed, EXTRACT_TARGET_FOLDER);

      const stats = fs.statSync(EXTRACT_TARGET_FILE);
      expect(stats).to.be.an(Object);

      const srcFileHash = await fileHash(SRC_FILE_UNCOMPRESSED);
      const targetFileHash = await fileHash(EXTRACT_TARGET_FILE);
      expect(targetFileHash).to.eql(srcFileHash);
    });
  });

  describe('bz2()', () => {
    it('throws an Error given a non-bz2 file', async () => {
      let thrownException;
      try {
        await extract.bz2(SRC_FILE_UNCOMPRESSED, EXTRACT_TARGET_FOLDER);
      } catch (e) {
        thrownException = e;
      }

      expect(thrownException).to.be.an(Error);
    });

    it('throws an Error given a non-tar.bz2 file', async () => {
      const srcFile = `${SRC_FILE_UNCOMPRESSED}.bz2`;

      let thrownException;
      try {
        await extract.bz2(srcFile, EXTRACT_TARGET_FOLDER);
      } catch (e) {
        thrownException = e;
      }

      expect(thrownException).to.be.an(Error);
    });

    it('successfully extracts a valid tar.bz2 file to the given target', async () => {
      const srcFileCompressed = `${SRC_FILE_UNCOMPRESSED}.tar.bz2`;
      await extract.bz2(srcFileCompressed, EXTRACT_TARGET_FOLDER);

      const stats = fs.statSync(EXTRACT_TARGET_FILE);
      expect(stats).to.be.an(Object);

      const srcFileHash = await fileHash(SRC_FILE_UNCOMPRESSED);
      const targetFileHash = await fileHash(EXTRACT_TARGET_FILE);
      expect(targetFileHash).to.eql(srcFileHash);
    });
  });
});
