var fs = require('fs');
var mysql = require('mysql');

var g_host = '165.194.35.161';
var g_user = 'food';
var g_pw = 'truck';

exports.getArticle = function(req, res) {
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});

	idx = req.param('idx');

	if(idx==undefined) {
		res.end('{"code":301}');
		return;
	}
	else if(idx.length==0) {
		res.end('{"code":302}');
		return;
	}

	var client = mysql.createConnection({
		host: g_host,
		user: g_user,
		password: g_pw
	});

	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query('select article.idx as idx, filename, writer, writer_type, contents, article.like, belong_to, reg_date from aroundthetruck.article, aroundthetruck.photo where article.idx=? and article.photo_idx=photo.idx',
		[idx],
		function(err, result, fields) {
			if(err) {
				res.end('{"code":303}');
				return;
			}
			else {
				//result[0]['reg_date'] = UTCtoLocal(result[0]['reg_date']);
				result = UTCtoLocal(result);
				jsonStr = '{"code":300,"result":'+JSON.stringify(result)+'}';
				res.end(jsonStr);
				return;
			}
		}
	);
};

exports.getArticleList = function(req, res) {
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});

	writer = req.param('writer');
	writer_type = req.param('writer_type');

	if(writer==undefined || writer_type==undefined) {
		res.end('{"code":304}');
		return;
	}
	else if(writer.length==0 || writer_type.length==0) {
		res.end('{"code":305}');
		return;
	}

	var client = mysql.createConnection({
		host: g_host,
		user: g_user,
		password: g_pw
	});

	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query('select article.idx as idx, filename, writer, writer_type, contents, \"like\", belong_to, reg_date from aroundthetruck.article, aroundthetruck.photo where article.writer=? and article.writer_type=? and article.photo_idx=photo.idx order by idx desc',
		[writer, writer_type],
		function(err, result, fields) {
			if(err) {
				res.end('{"code":303}');
				return;
			}
			else {
				result = UTCtoLocal(result);
				jsonStr = '{"code":300,"result":'+JSON.stringify(result)+'}';
				res.end(jsonStr);
				return;
			}
		}
	);
};

function UTCtoLocal(str) {
	for(var i=0 ; i<str.length ; i++) {
		var res = "";
		var d = new Date(str[i]['reg_date']);

		res += d.getFullYear()+"-";
		res += (((d.getMonth()+1)<10)?"0"+(d.getMonth()+1):(d.getMonth()+1))+"-";
		res += (((d.getDate())<10)?"0"+(d.getDate()):(d.getDate()))+" ";
		res += (((d.getHours())<10)?"0"+(d.getHours()):(d.getHours()))+":";
		res += (((d.getMinutes())<10)?"0"+(d.getMinutes()):(d.getMinutes()))+":";
		res += (((d.getSeconds())<10)?"0"+(d.getSeconds()):(d.getSeconds()))+"";	

		str[i]['reg_date'] = res;
	}
	return str;
}