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
const csvRead = require('./csvRead.js')
const AppendInitVect = require('./appendInitVect');
// const pretty = require('prettysize');
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
  const readInputFile = fs.readFileSync(file);
  const oFileHash = crypto.createHash('sha256').update(readInputFile).digest('hex');
  console.log("oFileHash", oFileHash)
  if (!fs.existsSync(csvFile)) {
    startEncryption(password, oFileHash, file)
  } else {
    checkIfRecordExists(csvFile, oFileHash, (err, recordStatus) => {
      if (err) {
        return console.log(err)
      }
      startEncryption(password, oFileHash, file)
    })
  }
}

function startEncryption(password, oFileHash, file) {

  const inputFilePath = path.join(__dirname, `../${file}`)
  console.log("inputPath:", inputFilePath)
  var encryptDir = 'encryptedFile';

  if (!fs.existsSync(encryptDir)) {
    fs.mkdirSync(encryptDir);
  }
  const initVect = crypto.randomBytes(16);

  // Generate a cipher key from the password.
  const CIPHER_KEY = getCipherKey(password);

  const readStream = fs.createReadStream(file);
  const cipher = crypto.createCipheriv(ALGORITHM, CIPHER_KEY, initVect);
  const appendInitVect = new AppendInitVect(initVect);
  // saveFilePath = encryptDir + '/' + oFileHash + ENCRYPED_EXT
  const saveFilePath = path.join(encryptDir, oFileHash + ENCRYPED_EXT)
  console.log("saveFilePath", saveFilePath)
  const writeStream = fs.createWriteStream(saveFilePath);

  writeStream.on('close', () => {
    console.log('Encryption success!');
    splitEncFile(saveFilePath, oFileHash, inputFilePath, file, (err, callback) => {
      if (err) {
        return console.log(err)
      }
      console.log("splitting succesfull!")
    })
  })

  console.log('Encryption started!');

  readStream
    // .pipe(gzip)
    .pipe(cipher)
    .pipe(appendInitVect)
    .pipe(writeStream);
  console.log('Encryption in progress!');
}

function splitEncFile(saveFilePath, oFileHash, inputFilePath, file, callback) {
  splitFile.splitFile(saveFilePath, splitSizeParts)
    .then((names) => {
      // console.log(names);
      uuidNameArray = []
      var index = 0
      var sequenceDir = 'sequenceFile';

      if (!fs.existsSync(sequenceDir)) {
        fs.mkdirSync(sequenceDir);
      }
      const sequenceCsv = oFileHash + '.csv'
      const saveSquenceCsvDir = path.join(sequenceDir, sequenceCsv)
      names.forEach(fileSequence => {
        var readSequenceFile = fs.readFileSync(fileSequence);

        const splitFileHash = crypto.createHash('sha256').update(readSequenceFile).digest('hex');
        console.log("splitFileHash:", splitFileHash)

        const sequnceFile = path.basename(fileSequence)
        const dirName = path.dirname(fileSequence)
        const dirLocation = path.join(__dirname, `../${dirName}`) // whole path to encryptedFile


        sequnceName = sequnceFile.split(".");
        const uuidName = uuidv4() + '.dat' //+ sequnceName[0];
        console.log("uuid:", uuidName)
        // console.log("FILENAME:", fileSequence)
        const sequncePath = path.join(dirName, uuidName);
        fs.renameSync(fileSequence, sequncePath);
        uuidNameArray.push(uuidName)
        // console.log("uuidNameArray: ", uuidNameArray)


        var writer
        if (!fs.existsSync(saveSquenceCsvDir))
          writer = csvWriter({
            headers: ["sequence", "sequenceName", "splitFileHash", "location"]
          })
        else
          writer = csvWriter({
            sendHeaders: false
          });

        writer.pipe(fs.createWriteStream(saveSquenceCsvDir, {
          flags: 'a'
        }))
        writer.write({
          sequence: index,
          sequenceName: uuidName,
          splitFileHash,
          location: dirLocation,
        })
        writer.end()
        index += 1
      });
    })
    .catch((err) => {
      callback(err)
      console.log('Error: ', err);
    });
  const readEncFile = fs.readFileSync(saveFilePath);

  const encHash = crypto.createHash('sha256').update(readEncFile).digest('hex');

  var writer
  if (!fs.existsSync(csvFile))
    writer = csvWriter({
      headers: ["fileName", "fileHash", "encryptedFileHash", "fileSize", "fileLocation"]
    })
  else {
    writer = csvWriter({
      sendHeaders: false
    });
  }
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
    fileLocation: inputFilePath
  })
  writer.end()
  callback(null, true)
}

function checkIfRecordExists(csvFile, oFileHash, callback) {
  csvRead.csvReadObject(csvFile, (err, csvData) => {
    if (err) {
      callback(`No records in ${csvFile}`)
      return console.log(err)
    }
    // console.log("csvData", csvData)
    let ifRecordExits = false
    csvData.forEach(record => {
      if (ifRecordExits) {
        return
      }
      if (record.fileHash === oFileHash) {
        // console.log("file already exist in records csv file!")
        // throw "file already exist in records csv file!"
        // return "file already exist in records csv file!"
        // process.exit(0)
        ifRecordExits = true
      }
    });

    if (!ifRecordExits) {
      callback(null, true)
    } else {
      callback("file already exist in records csv file!")
    }
  });
}

function getShardSize(file, shards, callback) {
  if (err) {
    callback("Not able to get shard size")
    return console.log(err)
  }
  var stats = fs.statSync(file)
  var fileSizeInBytes = stats["size"]
  var SizeInMb = pretty(fileSizeInBytes)
  var shardSizeInMb = Math.floor(SizeInMb/shards)
  callback(null, shardSizeInMb)
}
module.exports = encrypt;