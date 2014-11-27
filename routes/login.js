var mysql = require('mysql');

exports.login = function(req, res){
	res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});
	try
	{
		// json 으로 온 데이터를 파싱.
		var email = req.body.email;
		var pw = req.body.pw;

		console.log("input email: "+email);
		console.log("input pw: "+pw);

		// mysql 에서 찾기
		var client = mysql.createConnection({
			host: 'localhost',
			user: 'sgenuser',
			password: 'sgen123'
		});

		// 로그인 성공, 실패 여부를 알려줌.
		client.query('use sgen');
		client.query('select * from user where email=? and pw=?',
			[email, pw],
			function(error, result, fields) {
				if(error) {
					console.log('there\'s error in query!!');
					console.log(error);
				}

				else {
					console.log(JSON.stringify(result));

					// 0, 1, 2명 case dealing
					var jsonStr = '';
					console.log('result.length = '+result.length);
					if(result.length==0) {
						jsonStr = '{"code":1}';
						res.end(jsonStr);
					}
					else if(result.length==1) {
						// session 생성
						req.session.email = result[0].email;
						req.session.nick = result[0].nick;
						req.session.age = result[0].age;
						req.session.character = result[0].character;
						req.session.category = result[0].category;
						//임시로 생성
						req.session.comment = '';
						
						req.session.authenticated = true;
						
						jsonStr = '{"code":2,"result":'+JSON.stringify(result)+'}';
						console.log(jsonStr);
						res.end(jsonStr);
					}
					else {
						// 이건 큰일나는 경우 ㅠㅠ
						jsonStr = '{"code":3}';
						res.end(jsonStr);
					}
				}
		});
	}
	catch (err)	{	console.log(err);	}
};