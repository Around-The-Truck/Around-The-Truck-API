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
		client.end();
		return;
	}
	else if(phoneNum.length==0) {
		res.end('{"code":402}');
		client.end();
		return;
	}

	client.query('set names utf8');
	client.query('use aroundthetruck');
	client.query('select truck.idx, truck.name, (select cat_name from category where category.idx=truck.category_id) as cat_name_big, (select cat_name from category where category.idx=truck.category_small) as cat_name_small, truck.follow_count, (select filename from photo where photo.idx=truck.photo_id) as filename from follow_list, truck where tidx=truck.idx and customer=?',
		[phoneNum],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":403}');
				client.end();
				return;
			}
			else {
				jsonStr = '{"code":400,"result":'+JSON.stringify(result)+'}';
				res.end(jsonStr);
				client.end();
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
		client.end();
		return;
	}
	else if(phoneNum.length==0) {
		res.end('{"code":402}');
		client.end();
		return;
	}

	client.query('set names utf8');
	client.query('use aroundthetruck');
	client.query('select sum(point) as sum, reg_date as date from point_history where customer_phone=01044550423 group by date(reg_date) order by reg_date desc',
		[phoneNum],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":403}');
				client.end();
				return;
			}
			else {
				result = UTCtoLocal(result, 'date');
				jsonStr = '{"code":400,"result":'+JSON.stringify(result)+'}';
				res.end(jsonStr);
				client.end();
				return;
			}
		}
	);
};

exports.getOpenHistory = function (req, res) {
	res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});

	var client = mysql.createConnection({
		host: g_host,
		user: g_user,
		password: g_pw
	});

	truckIdx = req.param('truckIdx');

	// param Valid Check
	if(truckIdx==undefined) {
		res.end('{"code":401}');
		client.end();
		return;
	}
	else if(truckIdx.length==0) {
		res.end('{"code":402}');
		client.end();
		return;
	}

	client.query('set names utf8');
	client.query('use aroundthetruck');
	client.query('SELECT * FROM aroundthetruck.open_history where truckIdx=?',
		[truckIdx],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":403}');
				client.end();
				return;
			}
			else {
				result = UTCtoLocal(result, 'start');
				result = UTCtoLocal(result, 'end');
				jsonStr = '{"code":400,"result":'+JSON.stringify(result)+'}';
				res.end(jsonStr);
				client.end();
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