var mysql = require('mysql');

var g_host = '165.194.35.161';
var g_user = 'food';
var g_pw = 'truck';

exports.getFollowList = function (req, res) {
	res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});

	var client = mysql.createConnection({
		host: g_host,
		user: g_user,
		password: g_pw
	});

	phoneNum = req.param('phoneNum');

	// param Valid Check
	if(phoneNum==undefined) {
		res.end('{"code":401}');
		return;
	}
	else if(phoneNum.length==0) {
		res.end('{"code":402}');
		return;
	}뀨잉

	client.query('set names utf8');
	client.query('use aroundthetruck');
	client.query('select * from truck where customer=?',
		[phoneNum],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":403}');
				return;
			}
			else {
				jsonStr = '{"code":400,"result":'+JSON.stringify(result)+'}';
				res.end(jsonStr);
				return;
			}
		}
	);
};

exports.getPointHistory = function (req, res) {
	res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});

	var client = mysql.createConnection({
		host: g_host,
		user: g_user,
		password: g_pw
	});

	phoneNum = req.param('phoneNum');

	// param Valid Check
	if(phoneNum==undefined) {
		res.end('{"code":401}');
		return;
	}
	else if(phoneNum.length==0) {
		res.end('{"code":402}');
		return;
	}

	client.query('set names utf8');
	client.query('use aroundthetruck');
	client.query('select * from point_history where customer_phone=? order by idx desc',
		[phoneNum],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":403}');
				return;
			}
			else {
				result = UTCtoLocal(result, 'reg_date');
				jsonStr = '{"code":400,"result":'+JSON.stringify(result)+'}';
				res.end(jsonStr);
				return;
			}
		}
	);
};

function UTCtoLocal(obj, fieldName) {
	for(var i=0 ; i<obj.length ; i++) {
		var res = "";
		var d = new Date(obj[i][fieldName]);

		res += d.getFullYear()+"-";
		res += (((d.getMonth()+1)<10)?"0"+(d.getMonth()+1):(d.getMonth()+1))+"-";
		res += (((d.getDate())<10)?"0"+(d.getDate()):(d.getDate()))+" ";
		res += (((d.getHours())<10)?"0"+(d.getHours()):(d.getHours()))+":";
		res += (((d.getMinutes())<10)?"0"+(d.getMinutes()):(d.getMinutes()))+":";
		res += (((d.getSeconds())<10)?"0"+(d.getSeconds()):(d.getSeconds()))+"";	

		obj[i][fieldName] = res;
	}
	return obj;
}