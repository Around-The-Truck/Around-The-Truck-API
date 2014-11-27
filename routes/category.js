var mysql = require('mysql');

exports.getList = function(req, res){
	res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});

	// mysql 접속
	var client = mysql.createConnection({
		host: 'localhost',
		user: 'sgenuser',
		password: 'sgen123'
	});

	client.query('use sgen');
	client.query('select * from category',
		function(error, result, fields) {
			if(error) {
				console.log('there\'s error in query!!');
				console.log(error);
			}
			else {
				var jsonStr = '';
				if(result.length==0) {
					jsonStr = '{"code":201}';
					res.end(jsonStr);
				}
				else {
					jsonStr = '{"code":202,"result":'+JSON.stringify(result)+'}';
					res.end(jsonStr);
				}
			}
		}
	);
};

exports.setCategory = function(req, res) {
	res.writeHead(200, {'Content-Type':'json;charset=utf-8'});
	
	var catString = req.body.catString;
	// mysql 접속
	var client = mysql.createConnection({
		host: 'localhost',
		user: 'sgenuser',
		password: 'sgen123'
	});

	client.query('use sgen');
	client.query('UPDATE user SET `category`=? WHERE `email`=?',
		[catString, req.session.email],
		function(error, result) {
			if(error)	console.log("please.... :(");
			else {
				req.session.category = catString;
				res.end('{"code":203}');
			}
	});
};