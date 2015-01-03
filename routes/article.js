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
				result = UTCtoLocal(result, 'reg_date');
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
				result = UTCtoLocal(result, 'reg_date');
				jsonStr = '{"code":300,"result":'+JSON.stringify(result)+'}';
				res.end(jsonStr);
				return;
			}
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

exports.likeArticle = function(req, res) {
// num 받는다.
res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});

	articleNum = req.param('articleNum');

	if(articleNum==undefined) {
		res.end('{"code":501}');
		return;
	}
	else if(articleNum.length==0) {
		res.end('{"code":502}');
		return;
	}

	var client = mysql.createConnection({
		host: g_host,
		user: g_user,
		password: g_pw
	});


	// find
	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query('select * from article idx=?',
		[articleNum],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":503}');
				return;
			}
			else {
				// insert
				articleLikeCountUp(req, res, client, articleNum);
			}
		}
	);
// update
};

exports.addReply = function(req, res) {
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});

	articleIdx = req.param('articleIdx');
	writer = req.param('writer');
	writerType = req.param('writerType');
	contents = req.param('contents');

	if(articleIdx==undefined || writer==undefined || writerType==undefined || contents==undefined) {
		res.end('{"code":601}');
		return;
	}
	else if(articleIdx.length==0 || writer.length==0 || writerType.length==0 || contents.length==0) {
		res.end('{"code":602}');
		return;
	}

	var client = mysql.createConnection({
		host: g_host,
		user: g_user,
		password: g_pw
	});

	// find
	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query('select * from article where idx=?',
		[articleIdx],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":603}');
				return;
			}
			else {
				if(result.length==0) {
					res.end('{"code":604}');
					return;
				}
				else {
					// insert
					addReplyInsert(req, res, client, articleIdx, writer, writerType, contents);
				}
				
			}
		}
	);
// update
};

function addReplyInsert(req, res, client, articleIdx, writer, writerType, contents) {
	client.query('INSERT INTO `aroundthetruck`.`reply` (`contents`, `writer`, `writer_type`, `article_idx`, `reg_date`) VALUES (?, ?, ?, ?, NOW())',
		[contents, writer, writerType, articleIdx],
		function(err, result) {
			if(err) {
				res.end('{"code":605}');
				return;
			}
			else {
				res.end('{"code":600}');
				return;
			}
		}
	);
}

exports.getReplyList = function(req, res) {
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});

	articleIdx = req.param('articleIdx');

	if(articleIdx==undefined) {
		res.end('{"code":601}');
		return;
	}
	else if(articleIdx.length==0) {
		res.end('{"code":602}');
		return;
	}

	var client = mysql.createConnection({
		host: g_host,
		user: g_user,
		password: g_pw
	});

	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query('select * from reply where article_idx=? order by idx',
		[articleIdx],
		function(err, result, fields) {
			if(err) {
				res.end('{"code":606}');
				return;
			}
			else {
				result = UTCtoLocal(result, 'reg_date');
				jsonStr = '{"code":600,"result":'+JSON.stringify(result)+'}';
				res.end(jsonStr);
				return;
			}
		}
	);
};