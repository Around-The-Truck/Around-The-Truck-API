var fs = require('fs');
var im = require('imagemagick');

exports.upload = function(req, res){
	console.log("Received file:\n" + JSON.stringify(req.files));
};