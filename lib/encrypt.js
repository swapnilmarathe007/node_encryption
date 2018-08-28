const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
// const sha256 = crypto.createHash('sha256');
const splitFile = require('split-file');
const uuidv4 = require('uuid/v4');
const splitSizeParts = 3

const csvWriter = require('csv-write-stream')
const newLine = "\r\n";
const csvFile = 'records.csv'



const AppendInitVect = require('./appendInitVect');
const {
  ALGORITHM,
  ENCRYPED_EXT
} = require('./constants');
const {
  getCipherKey
} = require('./util');

function encrypt({
  file,
  password
}) {
  // Generate a secure, pseudo random initilization vector.

  const inputFilePath =  path.join(__dirname , file)
  console.log("inputPath:" , inputFilePath)
  var encryptDir = 'encryptedFile';

  if (!fs.existsSync(encryptDir)) {
    fs.mkdirSync(encryptDir);
  }
  const initVect = crypto.randomBytes(16);

  // Generate a cipher key from the password.
  const CIPHER_KEY = getCipherKey(password);

  const readStream = fs.createReadStream(file);
  const readInputFile = fs.readFileSync(file);

  const oFileHash = crypto.createHash('sha256').update(readInputFile).digest('hex');
  console.log("oFileHash", oFileHash)
  const gzip = zlib.createGzip();
  const cipher = crypto.createCipheriv(ALGORITHM, CIPHER_KEY, initVect);
  const appendInitVect = new AppendInitVect(initVect);
  // saveFilePath = encryptDir + '/' + oFileHash + ENCRYPED_EXT
  saveFilePath = path.join(encryptDir, oFileHash + ENCRYPED_EXT)
  console.log("saveFilePath", saveFilePath)
  const writeStream = fs.createWriteStream(saveFilePath);

  writeStream.on('close', () => {
    console.log('Encryption success!');
    splitFile.splitFile(saveFilePath, splitSizeParts)
      .then((names) => {
        console.log(names);
        uuidNameArray = []
        names.forEach(fileSequence => {
          // console.log("fileSequnce: ", path.basename(fileSequence))

          // const newFilePath = path.join(dir, newFile.replace(file, newFile));
          sequnceFile = path.basename(fileSequence)
          dirName = path.dirname(fileSequence)

          sequnceName = sequnceFile.split(".");
          const uuidName = uuidv4() + '.dat' //+ sequnceName[0];
          console.log("uuid:", uuidName)
          console.log("FILENAME:", fileSequence)
          const sequncePath = path.join(dirName, uuidName);
          fs.renameSync(fileSequence, sequncePath);
          console.log("path: ", sequncePath)
          uuidNameArray.push(uuidName)
          const squenceCsv = oFileHash + '.csv'
          var writer = csvWriter({
            sendHeaders: false
          })
          var stats = fs.statSync(file)
          var fileSizeInBytes = stats["size"]
          writer.pipe(fs.createWriteStream(squenceCsv, {
            flags: 'a'
          }))
          writer.write({
            sequence: uuidName,
            location: dirName,
          })
          writer.end()
        });
      })
    const readEncFile = fs.readFileSync(saveFilePath);

    const encHash = crypto.createHash('sha256').update(readEncFile).digest('hex');
    if (!fs.existsSync(csvFile)) {
      var writer = csvWriter({
        headers: ["fileName", "fileHash", "encryptedFileHash", "fileSize", "fileLocation"]
      })
      var stats = fs.statSync(file)
      var fileSizeInBytes = stats["size"]
      writer.pipe(fs.createWriteStream('records.csv', {
        flags: 'a'
      }))
      writer.write([file, oFileHash, encHash, fileSizeInBytes, inp])
      writer.end()
    } else {
      var writer = csvWriter({
        sendHeaders: false
      })
      var stats = fs.statSync(file)
      var fileSizeInBytes = stats["size"]
      writer.pipe(fs.createWriteStream('records.csv', {
        flags: 'a'
      }))
      writer.write({
        fileName: file,
        fileHash: oFileHash,
        encryptedFileHash: encHash,
        fileSize: fileSizeInBytes,
        inputFilePath
      })
      writer.end()
    }
  })

  console.log('Encryption started!');

  readStream
    // .pipe(gzip)
    .pipe(cipher)
    .pipe(appendInitVect)
    .pipe(writeStream);
  console.log('Encryption in progress!');

}

module.exports = encrypt;