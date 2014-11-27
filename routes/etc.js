var mysql = require('mysql');
var emailjs = require('emailjs');
var fs = require('fs');
var email_server  = emailjs.server.connect({
   user:    "jk2.square@gmail.com", 
   password:"jkadminsq", 
   host:    "smtp.gmail.com", 
   ssl:     true
});

exports.makeReport = function(req,res){
	res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
	var client = mysql.createConnection({
		host: 'localhost',
		user: 'sgenuser',
		password: 'sgen123'
	});
	try{
		var txt = req.body.message;
		var message = {
			text:    "안녕하세요, JK Square입니다.\n신고된 대화 본문 보기 (아래)\n\n " + txt,
			from:    "JK Square <jk2.square@gmail.com>", 
			to:      "관리자 <rlaace423@gmail.com>",
			subject: "[JK Square] 신고내용 접수",
		};
		email_server.send(message,function(err,msg){
			if(err) {
				console.log("Error : "+err);
				res.end('{"code":802}');
			}
			else res.end('{"code":801}');
		});
		res.end('{"code":801}');
	}
	catch(e){
		console.log(err);
		res.end('{"code":802}');
	}
};