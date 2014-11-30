var fs = require('fs');


exports.upload = function(req, res) {
    fs.readFile(req.files.file.path, function (err, data) {
        var fileName = req.files.file.name;

        if(!fileName){
            res.end("no..");
        }
        else {
            var Path = __dirname + "/../upload/" + fileName;

            fs.writeFile(Path, data, function (err) {
                res.writeHead(200, {'Content-Type': 'text/html' });
                res.end('Upload success');
            });
        }
    });
};