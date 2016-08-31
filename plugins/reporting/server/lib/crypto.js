import crypto from 'crypto';
import oncePerServer from './once_per_server';

/**
 * Implmenetation of encrypt() and decrypt() taken from https://gist.github.com/AndiDittrich/4629e7db04819244e843,
 * which was recommended by @jaymode
 */
function cryptoFactory(server) {

  const encryptionKey = server.config().get('xpack.reporting.encryptionKey');
  const ivLengthInBytes = 12;
  const saltLengthInBytes = 64;
  const keyLengthInBytes = 32;
  const keyIterations = 10000;
  const keyDigest = 'sha512';
  const cipherAlgorithm = 'aes-256-gcm';
  const encryptionResultEncoding = 'base64';

  function _generateSalt() {
    return crypto.randomBytes(saltLengthInBytes);
  }

  function _generateIV() {
    return crypto.randomBytes(ivLengthInBytes);
  }

  function _generateKey(salt) {
    if (!Buffer.isBuffer(salt)) {
      salt = new Buffer(salt, encryptionResultEncoding);
    }

    return new Promise((resolve, reject) => {
      crypto.pbkdf2(encryptionKey, salt, keyIterations, keyLengthInBytes, keyDigest, (err, key) => {
        if (err) {
          reject(err);
          return;
        }

        if (!Buffer.isBuffer(key)) {
          key = new Buffer(key, 'binary');
        }

        resolve(key);
      });
    });
  }

  function _serialize(obj) {
    return new Promise((resolve, reject) => {
      const serializedObj = JSON.stringify(obj);
      if (serializedObj === undefined) {
        reject(new Error('Object to be encrypted must be serializable'));
        return;
      }
      resolve(serializedObj);
    });
  }

  function encrypt(input) {
    const salt = _generateSalt();

    return Promise.all([
      _serialize(input),
      _generateIV(),
      _generateKey(salt)
    ])
    .then(results => {
      const [ serializedInput, iv, key ] = results;
      const cipher = crypto.createCipheriv(cipherAlgorithm, key, iv);

      const encrypted = Buffer.concat([cipher.update(serializedInput, 'utf8'), cipher.final()]);
      const tag = cipher.getAuthTag();

      return Buffer.concat([salt, iv, tag, encrypted]).toString(encryptionResultEncoding);
    });
  }

  async function decrypt(output) {

    const outputBytes = new Buffer(output, encryptionResultEncoding);

    const salt = outputBytes.slice(0, saltLengthInBytes);
    const iv = outputBytes.slice(saltLengthInBytes, saltLengthInBytes + ivLengthInBytes);
    const tag = outputBytes.slice(saltLengthInBytes + ivLengthInBytes, saltLengthInBytes + ivLengthInBytes + 16); // Auth tag is always 16 bytes long
    const text = outputBytes.slice(saltLengthInBytes + ivLengthInBytes + 16);

    const key = await _generateKey(salt);
    const decipher = crypto.createDecipheriv(cipherAlgorithm, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  return {
    encrypt,
    decrypt
  };
}

module.exports = oncePerServer(cryptoFactory);
