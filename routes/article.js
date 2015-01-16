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
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});
	// writer idx 받아서
	var truckIdx = req.param('truckIdx');

	if (truckIdx==undefined) {
		res.end('{"code":301}');
		return;
	}
	if (truckIdx.length==0) {
		res.end('{"code":302}');
		return;	
	}
	// 해당 아티클 다 뽑고
	var client = mysql.createConnection({
		host: g_host,
		user: g_user,
		password: g_pw
	});

	// 여기서, 글쓴이는 무조건 트럭이라고 가정.
	// 손님 글쓰기를 고려한다면 서브 쿼리가 바뀌어야함!
	client.query('use aroundthetruck');
	client.query('set names utf8');
	// idx, filename, truck_filename, truckIdx, contents, like, reg_date
	client.query('select article.idx as idx, filename, (select filename from photo where idx=(select photo_id from truck where truck.idx=?)) as truck_filename, writer as truckIdx, contents, `like`, reg_date from aroundthetruck.article, aroundthetruck.photo where article.writer=? and article.writer_type=? and article.photo_idx=photo.idx order by idx desc',
		[truckIdx, truckIdx, 1],
		function(err, result_article, fields) {
			if(err) {
				res.end('{"code":303}');
				client.end();
				return;
			}
			else {
				if(result_article.length==0) {
					jsonStr = '{"code":300,"result":[]}';
					res.end(jsonStr);
					client.end();
					return;
				}
				result_article = UTCtoLocal(result_article, 'reg_date');
				getReplies (res, client, result_article, truckIdx);
				return;
			}
		}
	);
};
// 해당 댓글 다 뽑고
function getReplies (res, client, result_article, truckIdx) {
	// r_idx, r_contents, r_writer, r_writer_name, r_writer_filename, r_article_idx, r_reg_date
	var queryStr = "SELECT idx as r_idx, contents as r_contents, writer as r_writer, (select name from customer where customer.phone=reply.writer) as r_writer_name, (select filename from photo where photo.idx=(select photo_profile from customer where customer.phone=reply.writer)) as r_writer_filename, article_idx as r_article_idx, reg_date as r_reg_date FROM aroundthetruck.reply where article_idx in (";
	for (var i=0 ; i<result_article.length ; i++) {
		queryStr += "'"+result_article[i]['idx']+"',";
		//'1', '2', '3'
	}
	queryStr = queryStr.substring(0, queryStr.length-1);
	queryStr += ") order by r_reg_date;";

	client.query(queryStr,
		function (error, result_reply) {
			if (error) {
				res.end('{"code":306}');
				client.end();
				return;
			}
			result_reply = UTCtoLocal(result_reply, 'r_reg_date');
			assembleTimeline (res, client, result_article, result_reply, truckIdx);
			return;
		}
	);
}
// 조립해서 넘겨준다.

function assembleTimeline (res, client, result_article, result_reply, truckIdx) {
	// article
	// // idx, filename, truck_filename, truckIdx, contents, like, reg_date

	// reply
	// // r_idx, r_contents, r_writer, r_writer_name, r_writer_filename, r_article_idx, r_reg_date

	// 일단 배열을 만든다.
	for (var i=0 ; i<result_article.length ; i++) {
		result_article[i]['reply'] = Array();
	}

	// 각 댓글마다 제자리를 찾아준다.
	for (var i=0 ; i<result_reply.length ; i++) {
		for(var j=0 ; j<result_article.length ; j++) {
			if(result_reply[i]['r_article_idx']==result_article[j]['idx']) {
				result_article[j]['reply'].push(result_reply[i]);
				break;
			}
		}
	}

	var jsonStr = '{"code":300,"result":'+JSON.stringify(result_article)+'}';
	res.end(jsonStr);
	client.end();
	return;
}

/*
// Data EXample
[{"photoFieldName":"file0", "name":"맛있는 군인들", "price":"1000", "description":"건강에 좋습니다.", "ingredients":"군인1, 군인2, 군인3"},{"photoFieldName":"file1", "name":"특급전사", "price":"1000", "description":"화끈한 특급전사", "ingredients":"진이형"},{"photoFieldName":"file2", "name":"담배맛현우", "price":"1000", "description":"건강에 안좋아요", "ingredients":"이현우"}]
*/
exports.writeArticle = function(req, res){
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});
	try
	{
		console.log("1");
		var writer = req.param('writer');
		var writerType = req.param('writerType');
		var contents = req.param('contents');
		var belongTo = req.param('belongTo');
		console.log("2");
		if(req.files.file==undefined) {
			res.end('{"code":307}');
			return;
		}
		console.log("3");
		if(!req.files.file.name) {
			res.end('{"code":308}');
			return;
		}
		console.log("4");
		if(writer==undefined || writerType==undefined || contents==undefined || belongTo==undefined) {
			res.end('{"code":301}');
			return;
		}
		console.log("5");
		if(writer.length==0 || writerType.length==0 || contents.length==0 || belongTo.length==0) {
			res.end('{"code":302}');
			return;
		}
		console.log("6");
		uploadImageArticle (res, writer, writerType, contents, belongTo, req.files.file);
		return;
	}
	catch (err)	{
		res.end('{"code":309}');
		return;
	}
};

var uploadImageArticle = function (res, writer, writerType, contents, belongTo, fileData) {
	var fileName = "";
	// 파일 읽기
	try {
		var data = fs.readFileSync(fileData.path);
		var path = __dirname + "/../public/upload/";
		fileName = fileData.name;

		if(!fileName) {
	        res.end('{"code":310}');
	        return ;
	    }

        while(fs.existsSync(path+fileName))
        	fileName = "_" + fileName;

        try {
        	var writeResult = fs.writeFileSync(path+fileName, data);
        } catch (ee) {
        	res.end('{"code":224}');
			return ;
        }
	} catch (e) {
		res.end('{"code":222}');
		return ;
	}	
	
	insertRowImageArticle (res, fileName, writer, writerType, contents, belongTo);
	return;
};

var insertRowImageArticle = function insertRowImageArticle (res, fileName, writer, writerType, contents, belongTo) {

	var client = mysql.createConnection({
		host: '165.194.35.161',
		user: 'food',
		password: 'truck'
	});

	var queryStr = "INSERT INTO photo ( publisher, publisher_type, filename ) VALUES (?, ?, ?)";

	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query(queryStr,
		[writer, writerType, fileName],
		function(error, result) {
			if(error) {
				res.end('{"code":311}');
				client.end();
				// TODO: 파일 지우기 : removeFile(fileName)
				return;
			}
			else {
				insertRowArticle (client, res, fileName, result.insertId, writer, writerType, contents, belongTo);
				return;
			}
		}
	);
}

var insertRowArticle = function insertRowArticle (client, res, fileName, photo_idx, writer, writerType, contents, belongTo) {
	var queryStr = "INSERT INTO `aroundthetruck`.`article` (`photo_idx`, `writer`, `writer_type`, `contents`, `like`, `belong_to`, `reg_date`) VALUES (?, ?, ?, ?, '0', ?, NOW())";

	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query(queryStr,
		[photo_idx, writer, writerType, contents, belongTo],
		function(error, result) {
			if(error) {
				res.end('{"code":229}');
				client.end();
				return;
			}
			else {
				res.end('{"code":312}');
				client.end();
				return;
			}
		}
	);
};














