const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const sha256 = crypto.createHash('sha256');
const originalFileHash = crypto.createHash('sha256');
const csvReaad = require('./csvRead.js')
const recordCsv = './records.csv'
const splitFile = require('split-file');

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
  var fileHash = path.basename(file)
  var oFileHash = fileHash.split(".");
  const hashFile = oFileHash[0]
  console.log("Hash:", hashFile)
  csvReaad.csvReadObject(recordCsv, (err, csvData) => {
    if (err) {
      console.log(err)
    }
    // console.log("csvData", csvData)
    var fileRecordData = null
    csvData.forEach(record => {
      if (record.fileHash === hashFile) {
        // console.log("record:", record)
        fileRecordData = record
      }
    });
    if (fileRecordData) {
      const sequenceCSVPath = path.join('sequenceFile', `${fileRecordData.fileHash}.csv`)
      csvReaad.csvReadObject(sequenceCSVPath, (err, sequenceData) => {
        sequenceData.sort(function (a, b) {
          return a.sequence - b.sequence
        });
        // console.log("recordList", sequenceData)
        sqeuenceHashPath = []
        sequenceData.forEach(record => {
          // console.log("---", record)
          const sequencePath = path.join(record.location, record.sequenceName)
          const readSequenceFile = fs.readFileSync(sequencePath);
          const hash = crypto.createHash('sha256').update(readSequenceFile).digest('hex');
          console.log("hash: ", hash)
          if (hash === record.splitFileHash)
            sqeuenceHashPath.push(sequencePath)
          else {
            console.log("invalid hash of splitted files")
            process.exit(1)
          }
        })

        // console.log("===", sqeuenceHashPath)
        let mergedEncrypedFileName = `${fileRecordData.fileName}.encrypted`
        let decyrptPathLocation = path.join(__dirname, `../${decryptDir}`)
        let mergedEncrypedFileFilePath = path.join(decyrptPathLocation, mergedEncrypedFileName)
        let outputFileName = `${fileRecordData.fileName}`
        let outputFilePath = path.join(decyrptPathLocation, outputFileName)
        console.log("outputfile:", outputFilePath)

        console.log("outputFileName:", mergedEncrypedFileName)
        // setTimeout(() => {
        splitFile.mergeFiles(sqeuenceHashPath, mergedEncrypedFileFilePath)
          .then(() => {
            console.log('Done!');
            const readInputFile = fs.readFileSync(mergedEncrypedFileFilePath);

            const mergeFileHash = crypto.createHash('sha256').update(readInputFile).digest('hex');
            console.log("hash-of-merge-file", mergeFileHash)

            if(fileRecordData.encryptedFileHash === mergeFileHash)
            {
            const readInitVect = fs.createReadStream(mergedEncrypedFileFilePath, {
              end: 15
            });

            let initVect;
            readInitVect.on('data', (chunk) => {
              initVect = chunk;
            });

            // Once we've got the initialization vector, we can decrypt the file.
            readInitVect.on('close', () => {
              const CIPHER_KEY = getCipherKey(password);

              const readStream = fs.createReadStream(mergedEncrypedFileFilePath, {
                start: 16
              });

              const decipher = crypto.createDecipheriv(ALGORITHM, CIPHER_KEY, initVect);
              const unzip = zlib.createUnzip();

              const writeStream = fs.createWriteStream(outputFilePath);
              writeStream.on('close', () => {
                console.log('Decryption success!');
                // let sha256
                writeStream.on('data', function (data) {
                  sha256.update(data)
                })

                writeStream.on('end', function () {
                  var encHash = sha256.digest('hex') // 34f7a3113803f8ed3b8fd7ce5656ebec
                  console.log("encHash :", encHash);
                })
              });

              readStream
                .pipe(decipher)
                .pipe(writeStream);
            });
          }
          else{
            console.log("merge file hash and input hash does not match!")
          }
          })
          
          .catch((err) => {
            console.log('Error: ', err);
          });
      })
      // }, 6000);


    }
  });
}
module.exports = decrypt;