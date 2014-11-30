var fs = require('fs');
var im = require('imagemagick');

exports.upload = function(req, res){
	console.log("Received file:\n" + JSON.stringify(req.files));

	console.log(req.files.image.originalFilename);
 	console.log(req.files.image.path);

    fs.readFile(req.files.image.path, function (err, data){
    	var dirname = "/home/jason";
    	var newPath = dirname + "/uploads/" +   req.files.image.originalFilename;
    	fs.writeFile(newPath, data, function (err) {
    	if(err){
    		res.json({'response':"Error"});
    }else {
    	res.json({'response':"Saved"});
	}*/
};