var fs = require('fs');
var mysql = require('mysql');


var nick_result=0;

var email = null;
var pw = null;
var nick = null;

////////////////// new 
var g_host = 'localhost';
var g_user = 'food';
var g_pw = 'truck';

var userName = null;
var age = null;
var gender = null;
var job = null;
var phone = null;

var phone_result=0;
///////////////////////// new

var res_global = null;

exports.join = function(req, res){
	res_global = res;
	//res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});
	try
	{
		// json 으로 온 데이터를 파싱.
		userName = req.body.userName;
		age = req.body.age;
		gender = req.body.gender;
		job = req.body.job;
		phone = req.body.phone;
		
		console.log("input userName: "+userName);
		console.log("input age: "+age);
		console.log("input gender: "+gender);
		console.log("input job: "+job);
		console.log("input phone: "+phone);

		// db 에서 찾기
		var client = mysql.createConnection({
			host: g_host,
			user: g_user,
			password: g_pw
		});

		// db 접속
		
		email_result=0;
		nick_result=0;
		client.query('use aroundthetruck');
		client.query('set names utf8');
		client.query('select * from customer where phone=?',
			[phone],
			function(error, result, fields) {
				if(error) {
					console.log('there\'s error in query!!');
					console.log('ErrMsg: '+ error);
				}
				else {
					console.log('Phone Overlap Test');
					console.log(JSON.stringify(result));
					// 있는지 없는지 case dealing
					console.log('result.length = '+result.length);
					phone_result = result.length;
					// phone 중복 안 됨
					if(result.length==0) {
						console.log('Phone not overlapped');
					}
					// phone 중복됨
					else {
						console.log('Phone overlapped');
					}
					insertRow(client, res);
				}
		});
	}
	catch (err)	{	console.log(err);	}
};

exports.phoneOverlapCheck = function(req, res) {
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});
	phone = req.body.phone;

	// mysql 에서 찾기
	var client = mysql.createConnection({
		host: g_host,
		user: g_user,
		password: g_pw
	});

	// db 접속
	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query('select * from customer where phone=?',
		[email],
		function(error, result, fields) {
			if(error) {
				console.log('there\'s error in query!!');
				console.log('ErrMsg: '+ error);
			}
			else {
				console.log('Phone Overlap Test');
				console.log(JSON.stringify(result));
				// 있는지 없는지 case dealing
				console.log('result.length = '+result.length);

				// phone 중복 안 됨
				if(result.length==0) {
					console.log('Phone not overlapped');
					jsonStr = '{"code":105}';
					res.end(jsonStr);

				}
				// phone 중복됨
				else {
					console.log('Phone overlapped');
					jsonStr = '{"code":103}';
					res.end(jsonStr);
				}
			}
	});


};

var insertRow = function(client, res) {
	if(phone_result==0){
		// db에 insert
		client.query('INSERT INTO customer (`name`, `phone`, `gender`, `age`, `reg_date`) VALUES (?, ?, ?, ?, NOW())',
			[userName, phone, gender, age],
			function(error, result) {
				// insert 실패
				if(error) {
					jsonStr = '{"code":102}';
					res.end(jsonStr);
				}
				// insert 성공	
				else {
					jsonStr = '{"code":101}';
					res.end(jsonStr);
				}
		});
	}
	// 이미 phone이 존재하는 경우 (error)
	else{
		jsonStr = '{"code":103}';
		res_global.end(jsonStr);
	}
};

/////////////////////////////////////////////////////////////////
/// Below maybe not used....
/////////////////////////////////////////////////////////////////

exports.setComment = function(req, res) {
	res.writeHead(200, {'Content-Type':'json;charset=utf-8'});
	
	var comment = req.body.comment;
	// mysql 접속
	var client = mysql.createConnection({
		host: 'localhost',
		user: 'sgenuser',
		password: 'sgen123'
	});

	client.query('use sgen');
	client.query('UPDATE user SET `comment`=? WHERE `email`=?',
		[comment, req.session.email],
		function(error, result) {
			if(error) {
				console.log("in setComment ************************");
				res.end('{"code":702}');
			}
			else {
				req.session.comment = comment;
				res.end('{"code":701}');
			}
	});
};

var selectNick = function(client, nick) {
	client.query('select * from user where nick=?',
		[nick],
		function(error, result, fields) {
			if(error) {
				console.log('there\'s error in query!!');
				console.log('ErrMsg: '+ error);
			}

			else {
				console.log('Nick Overlap Test');
				console.log(JSON.stringify(result));
				// 있는지 없는지 case dealing
				console.log('result.length = '+result.length);
				nick_result = result.length;
				// nick 중복 안 됨
				if(result.length==0) {
					console.log('Nick not overlapped');
				}
				// nick 중복됨
				else {
					console.log('Nick overlapped');	
				}
				insertRow(client);
			}

	});
};