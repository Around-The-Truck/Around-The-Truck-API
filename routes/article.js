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
				client.end();
				return;
			}
			else {
				result = UTCtoLocal(result, 'reg_date');
				jsonStr = '{"code":300,"result":'+JSON.stringify(result)+'}';
				res.end(jsonStr);
				client.end();
				return;
			}
		}
	);
};

exports.getArticleList = function(req, res) {
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});

	var writer = req.param('writer');
	//writer_type = req.param('writer_type');

	if(writer==undefined/* || writer_type==undefined*/) {
		res.end('{"code":304}');
		return;
	}
	else if(writer.length==0/* || writer_type.length==0*/) {
		res.end('{"code":305}');
		return;
	}

	var client = mysql.createConnection({
		host: g_host,
		user: g_user,
		password: g_pw
	});

	// 여기서, 글쓴이는 무조건 트럭이라고 가정.
	// 손님 글쓰기를 고려한다면 서브 쿼리가 바뀌어야함!
	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query('select article.idx as idx, filename, (select filename from photo where idx=(select photo_id from truck where truck.idx=?)) as writer_filename, writer, writer_type, contents, `like`, belong_to, reg_date from aroundthetruck.article, aroundthetruck.photo where article.writer=? and article.writer_type=? and article.photo_idx=photo.idx order by idx desc',
		[writer, writer, 1],
		function(err, result, fields) {
			if(err) {
				res.end('{"code":303}');
				client.end();
				return;
			}
			else {
				result = UTCtoLocal(result, 'reg_date');
				jsonStr = '{"code":300,"result":'+JSON.stringify(result)+'}';
				res.end(jsonStr);
				client.end();
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
	phoneNum = req.param('phoneNum');

	if(articleNum==undefined || phoneNum==undefined) {
		res.end('{"code":501}');
		return;
	}
	else if(articleNum.length==0 || phoneNum.length==0) {
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
	client.query('select * from article where idx=?',
		[articleNum],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":503}');
				client.end();
				return;
			}
			else {
				if(result.length==0) {
					res.end('{"code":504}');
					client.end();
					return;		
				}
				else {
					likeArticleSelect(req, res, client, articleNum, phoneNum);
					return;
				}
			}
		}
	);
};
function likeArticleSelect(req, res, client, articleNum, phoneNum) {
	client.query('select * from aroundthetruck.article_like_list where customer_phone=? and article_idx=?',
		[phoneNum, articleNum],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":503}');
				client.end();
				return;
			}
			// 좋아요를 안했으므로 좋아요를 누른다. update & insert
			else if(result.length==0) {
				likeArticleUpdate(req, res, client, articleNum, phoneNum);
				return;
			}
			// 이미 좋아요를 눌렀다.
			else if(result.length==1) {
				res.end('{"code":507}');
				client.end();
				return;
			}
			// 그 외 디비 무결성 파괴의 경우...
			else {
				res.end('{"code":508}');
				client.end();
				return;
			}
		}
	);
}

function likeArticleUpdate(req, res, client, articleNum, phoneNum) {
	client.query('update aroundthetruck.article set `like`=`like`+1 where idx=?',
		[articleNum],
		function(error, result) {
			if(error) {
				res.end('{"code":505}');
				client.end();
				return;
			}
			else {
				likeArticleInsert(req, res, client, articleNum, phoneNum);
				return;
			}
	});
}

function likeArticleInsert(req, res, client, articleNum, phoneNum) {
	client.query('INSERT INTO `aroundthetruck`.`article_like_list` (`customer_phone`, `article_idx`) VALUES (?, ?)',
		[phoneNum, articleNum],
		function(err, result) {
			if(err) {
				res.end('{"code":506}');
				client.end();
				return;
			}
			else {
				res.end('{"code":500}');
				client.end();
				return;
			}
		}
	);
}

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
				client.end();
				return;
			}
			else {
				if(result.length==0) {
					res.end('{"code":604}');
					client.end();
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
				client.end();
				return;
			}
			else {
				res.end('{"code":600}');
				client.end();
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
				client.end();
				return;
			}
			else {
				result = UTCtoLocal(result, 'reg_date');
				jsonStr = '{"code":600,"result":'+JSON.stringify(result)+'}';
				res.end(jsonStr);
				client.end();
				return;
			}
		}
	);
};

exports.unlikeArticle = function(req, res) {
res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});

	articleNum = req.param('articleNum');
	phoneNum = req.param('phoneNum');

	if(articleNum==undefined || phoneNum==undefined) {
		res.end('{"code":501}');
		return;
	}
	else if(articleNum.length==0 || phoneNum.length==0) {
		res.end('{"code":502}');
		return;
	}

	var client = mysql.createConnection({
		host: '165.194.35.161',
		user: 'food',
		password: 'truck'
	});

	// find
	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query('select * from article where idx=?',
		[articleNum],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":503}');
				client.end();
				return;
			}
			else {
				if(result.length==0) {
					res.end('{"code":504}');
					client.end();
					return;		
				}
				else {
					unlikeArticleSelect(req, res, client, articleNum, phoneNum);
				}
			}
		}
	);
};
function unlikeArticleSelect(req, res, client, articleNum, phoneNum) {
	client.query('select * from aroundthetruck.article_like_list where customer_phone=? and article_idx=?',
		[phoneNum, articleNum],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":503}');
				client.end();
				return;
			}
			// 애초에 좋아요를 안했다.
			else if(result.length==0) {
				res.end('{"code":511}');
				client.end();
				return;
			}
			// 팔로우를 해제. update & insert
			else if(result.length==1) {
				zeroCheckArticle (req, res, client, articleNum, phoneNum);
				return;
			}
			// 그 외 디비 무결성 파괴의 경우...
			else {
				res.end('{"code":508}');
				client.end();
				return;
			}
		}
	);
}

function zeroCheckArticle (req, res, client, articleNum, phoneNum) {
	client.query('select if ((select `like` from article where idx=?)=0, "zero", "non-zero") as retVal',
		[articleNum],
		function (error, result, fields) {
			if(error) {
				res.end('{"code":512}');
				client.end();
				return;
			}
			// count down 하려 봤더니 이미 0이다... 
			else if (result[0]['retVal']=="zero") {
				// 바로 delete 작업을 실행
				console.log("goto delete directly (article)");
				unlikeArticleDelete(req, res, client, articleNum, phoneNum);
			}
			else {
				unlikeArticleUpdate(req, res, client, articleNum, phoneNum);
				return;
			}
		}
	);
}

function unlikeArticleUpdate(req, res, client, articleNum, phoneNum) {
	client.query('update aroundthetruck.article set `like`=`like`-1 where idx=?',
		[articleNum],
		function(error, result) {
			if(error) {
				res.end('{"code":513}');
				client.end();
				return;
			}
			else {
				unlikeArticleDelete(req, res, client, articleNum, phoneNum);
				return;
			}
	});
}

function unlikeArticleDelete(req, res, client, articleNum, phoneNum) {
	client.query('delete from `aroundthetruck`.`article_like_list` where `customer_phone`=? and `article_idx`=?',	
		[phoneNum, articleNum],
		function(err, result) {
			if(err) {
				res.end('{"code":506}');
				client.end();
				return;
			}
			else {
				res.end('{"code":500}');
				client.end();
				return;
			}
		}
	);
}

exports.getTimeline = function (req, res) {
	// 트럭 idx 받아서
	// 해당 아티클 다 뽑고
	// 해당 댓글 다 뽑고
	// 조립해서 넘겨준다.
};