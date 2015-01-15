var mysql = require('mysql');

var g_host = '165.194.35.161';
var g_user = 'food';
var g_password = 'truck';

exports.getCustomerInfo = function(req, res){
	res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});

	// mysql 접속
	var client = mysql.createConnection({
		host: g_host,
		user: g_user,
		password: g_password
	});

	customerPhone = req.param('customerPhone');

	if(customerPhone==undefined) {
		res.end('{"code":801}');
		return;
	}
	if(customerPhone.length==0) {
		res.end('{"code":802}');
		return;	
	}

	// 손님 정보를 받아온다.
	client.query('set names utf8');
	client.query('use aroundthetruck');
	client.query('select name, phone, gender, age, job, point, (select filename from photo where idx=customer.photo_profile) as photo_filename, reg_date from customer where customer.phone=?',
		[customerPhone],
		function(error, result, fields) {
			if(error) {
				console.log('there\'s error in query!!');
				res.end('{"code":803}');
				return;
			}
			result = UTCtoLocal(result, 'reg_date');
			jsonStr = '{"code":200,"result":'+JSON.stringify(result)+'}';
			res.end(jsonStr);
			return;
		}
	);
};







function UTCtoLocal(str, fieldName) {
	for(var i=0 ; i<str.length ; i++) {
		var res = "";
		var d = new Date(str[i][fieldName]);

		res += d.getFullYear()+"-";
		res += (((d.getMonth()+1)<10)?"0"+(d.getMonth()+1):(d.getMonth()+1))+"-";
		res += (((d.getDate())<10)?"0"+(d.getDate()):(d.getDate()))+" ";
		res += (((d.getHours())<10)?"0"+(d.getHours()):(d.getHours()))+":";
		res += (((d.getMinutes())<10)?"0"+(d.getMinutes()):(d.getMinutes()))+":";
		res += (((d.getSeconds())<10)?"0"+(d.getSeconds()):(d.getSeconds()))+"";	

		str[i][fieldName] = res;
	}
	return str;
}