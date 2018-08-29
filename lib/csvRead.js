var fs = require('fs');
var csv = require('csv');
const csvReadObject = (csvFilePath, callback) => {

    // var readStream = fs.createReadStream('./sequenceFile/3e668513be818d4aa59be629426e4b45e37c29effa8dd74ac2480d11635c31d1.csv');
    var strings = [];
    var readStream = fs.createReadStream(csvFilePath);

    var parser = csv.parse({
        columns: true
    });

    parser.on('readable', function () {
        while (record = parser.read()) {
            strings.push(record);
        }
    });

    parser.on('error', function (err) {
        console.log(err.message);
        callback(err.message)
    });

    parser.on('finish', (function () {
        // strings.sort(function (a, b) {
        //     return a.sequence - b.sequence
        // });
        // console.log("string:" ,strings);
        callback(null, strings)

    }));

    readStream.pipe(parser);
}

exports.csvReadObject = csvReadObject;