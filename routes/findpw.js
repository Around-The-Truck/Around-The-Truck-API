var mysql = require('mysql');
var emailjs = require('emailjs');
var fs = require('fs');
var email_server  = emailjs.server.connect({
   user:    "jk2.square@gmail.com", 
   password:"jkadminsq", 
   host:    "smtp.gmail.com", 
   ssl:     true
});
exports.findpw = function(req,res){
	res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
	var client = mysql.createConnection({
		host: 'localhost',
		user: 'sgenuser',
		password: 'sgen123'
	});
	try{
		var email = req.body.email;
		
		console.log("Pw Find : " + email);
		
		client.query('use sgen');
		client.query('set names utf8');
		client.query('select * from user where email=?',[email],
			function(error, result, fields) {
				if(error) {
					console.log('there\'s error in query!!');
					console.log('ErrMsg: '+ error);
				}
				else {
					console.log('Pw Finding...');
					console.log(JSON.stringify(result));
					console.log('result.length = '+result.length);
					if(result.length==0) {
						console.log('Email does not exist');
						res.end('{"code":302}');
					}
					else if(result.length>=2){
						console.log('Tooooooo many emails');
						res.end('{"code":303}');
					}
					else{
						var message = {
						   text:    "안녕하세요, JK Square입니다.\n귀하의 비밀번호는 " + result[0].pw + " 입니다.\n감사합니다.", 
						   from:    "JK Square <jk2.square@gmail.com>", 
						   to:      result[0].nick + "<" + result[0].email + ">",
						   subject: "[JK Square] 비밀번호 확인",
						};
						email_server.send(message,function(err,msg){
							if(err) console.log("Error : "+err);
							else console.log(msg);
						});
						res.end('{"code":301}');
					}
				}
		});
	}
	catch(e){
		console.log(err);
		res.end('');
	}
}