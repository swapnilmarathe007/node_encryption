const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const sha256 = crypto.createHash('sha256');
const originalFileHash = crypto.createHash('sha256');

const {
  ALGORITHM,
  ENCRYPED_EXT,
  UNENCRYPED_EXT
} = require('./constants');
const {
  getCipherKey
} = require('./util');

function decrypt({
  file,
  password
}) {
  var decryptDir = './decryptedFile';

  if (!fs.existsSync(decryptDir)) {
    fs.mkdirSync(decryptDir);
  }
  // const readPath = path.join(file + ENCRYPED_EXT);

  // First, get the initialization vector from the file.

  const readInitVect = fs.createReadStream(file, {
    end: 15
  });

  let initVect;
  readInitVect.on('data', (chunk) => {
    initVect = chunk;
  });

  // Once we've got the initialization vector, we can decrypt the file.
  readInitVect.on('close', () => {
    const CIPHER_KEY = getCipherKey(password);

    const readStream = fs.createReadStream(file, {
      start: 16
    });

    // let sha256
    stream.on('data', function (data) {
      sha256.update(data)
    })

    stream.on('end', function () {
      var encHash = sha256.digest('hex') // 34f7a3113803f8ed3b8fd7ce5656ebec
      console.log("encHash :", encHash);
    })
    const decipher = crypto.createDecipheriv(ALGORITHM, CIPHER_KEY, initVect);
    const unzip = zlib.createUnzip();
    filename = file.split("/");
    console.log("--", filename)

    decryptFile = filename[1].split(".");
    console.log("--", decryptFile)
    saveFilePath = decryptDir + '/' + decryptFile[0]
    console.log("saveFilePath", saveFilePath)
    const writeStream = fs.createWriteStream(saveFilePath);

    writeStream.on('close', () => {
      console.log('Decryption success!');
      const stream = fs.createReadStream(saveFilePath)
      // let sha256
      stream.on('data', function (data) {
        sha256.update(data)
      })

      stream.on('end', function () {
        var encHash = sha256.digest('hex') // 34f7a3113803f8ed3b8fd7ce5656ebec
        console.log("encHash :", encHash);
      })
    });

    readStream
      .pipe(decipher)
      .pipe(unzip)
      .pipe(writeStream);
  });
}

module.exports = decrypt;