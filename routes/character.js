var mysql = require('mysql');

exports.getSession = function(req, res){
	res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});

	//세션이 없다면 에러
	console.log("in the get Session..");
	if(req.session.email === null) {
		console.log("req.session.email == null");
		var jsonStr = '{"code":401}';
		res.end(jsonStr);
	}
	//세션이 있다면 전부다 리턴
	else {
		var temp = {};
		
		temp.email = req.session.email;
		temp.nickname = req.session.nick;
		temp.age = req.session.age;
		temp.character = req.session.character;
		temp.category = req.session.category;
		temp.comment = req.session.comment;
		temp.icon = req.session.icon;

		var jsonStr = '{"code":402,"result":'+JSON.stringify(temp)+'}';
		console.log("mySession's jsonStr=====> "+jsonStr);
		res.end(jsonStr);
	}
};

exports.setCharacter = function(req, res) {
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});
	
	var charString = req.body.charString;
	// mysql 접속
	var client = mysql.createConnection({
		host: 'localhost',
		user: 'sgenuser',
		password: 'sgen123'
	});

	client.query('use sgen');
	client.query('UPDATE user SET `character`=? WHERE `email`=?',
		[charString, req.session.email],
		function(error, result) {
			if(error) {
				console.log("setCharacter: Failed to set Character.................");
				res.end('{"code":502}');
			}
			else {
				req.session.character = charString;
				res.end('{"code":501}');
			}
	});
};