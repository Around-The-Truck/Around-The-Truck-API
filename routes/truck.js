
var mysql = require('mysql');

exports.getTruckList = function(req, res){
	res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});

	// mysql 접속
	var client = mysql.createConnection({
		host: 'localhost',
		user: 'food',
		password: 'truck'
	});

	res.end("hello");
	return;
	
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