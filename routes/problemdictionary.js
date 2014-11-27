var mysql = require('mysql');

exports.getProblemDictionaryList = function(req, res){
	res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});

	var catStrings = new Array();
	catStrings['money'] = '금전';
	catStrings['love'] = '사랑';
	catStrings['study'] = '학업';
	catStrings['ship'] = '대인관계';
	catStrings['etc'] = '기타';

	// json 으로 온 데이터를 파싱.
	var catString = req.body.catString;
	console.log("[getProblemDictionary] input catString: "+catString);

	// mysql 에서 찾기
	var client = mysql.createConnection({
		host: 'localhost',
		user: 'sgenuser',
		password: 'sgen123'
	});

	var queryStr = '';
	if(catString == 'undefined' || catString == 'all')
		queryStr = "select * from problemDictionary";
	else
		queryStr = "select * from problemDictionary where category=?";

	// 조회 성공, 실패 여부를 알려줌.
	client.query('use sgen');
	client.query(queryStr, [catStrings[catString]],
		function(error, result, fields) {
			if(error) {
				console.log('[getProblemDictionaryList] there\'s error in query!!');
				console.log('[getProblemDictionaryList] ' + error);
				res.end('{"code":603}');
			}

			else {
				console.log('[getProblemDictionaryList]' + JSON.stringify(result));

				var jsonStr = '';
				console.log('[getProblemDictionaryList] result.length = '+result.length);
				// 결과가 없을 때
				if(result.length==0) {
					jsonStr = '{"code":602}';
					res.end(jsonStr);
				}
				// 결과가 있을 때
				else {
					jsonStr = '{"code":601,"result":'+JSON.stringify(result)+'}';
					console.log(jsonStr);
					res.end(jsonStr);
				}
			}
	});
}

exports.getProblemDictionary = function(req, res){
	res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});

	var catStrings = new Array();
	catStrings['money'] = '금전';
	catStrings['love'] = '사랑';
	catStrings['study'] = '학업';
	catStrings['ship'] = '대인관계';
	catStrings['etc'] = '기타';

	// json 으로 온 데이터를 파싱.
	var num = Number(req.body.num);
	console.log("[getProblemDictionary] input num: "+num);

	// mysql 에서 찾기
	var client = mysql.createConnection({
		host: 'localhost',
		user: 'sgenuser',
		password: 'sgen123'
	});

	// 조회 성공, 실패 여부를 알려줌.
	client.query('use sgen');
	client.query('select * from problemDictionary where no=?', [num],
		function(error, result, fields) {
			if(error) {
				console.log('[getProblemDictionary] there\'s error in query!!');
				console.log('[getProblemDictionary] ' + error);
				res.end('{"code":606}');
			}

			else {
				console.log('[getProblemDictionary]' + JSON.stringify(result));

				var jsonStr = '';
				console.log('[getProblemDictionary] result.length = '+result.length);
				// 결과가 없을 때
				if(result.length==0) {
					jsonStr = '{"code":605}';
					res.end(jsonStr);
				}
				// 결과가 있을 때
				else {
					jsonStr = '{"code":604,"result":'+JSON.stringify(result)+'}';
					console.log(jsonStr);
					res.end(jsonStr);
				}
			}
	});
};

exports.insertProblemDictionary = function(data){
	var client = mysql.createConnection({
		host: 'localhost',
		user: 'sgenuser',
		password: 'sgen123'
	});
	var retVal = 'no';
	client.query('use sgen');
	client.query('INSERT INTO problemDictionary (`category`, `nick1`, `nick2`, `content`, `reg_date`) VALUES (?, ?, ?, ?,NOW())',
		[data.category, data.nick1, data.nick2, data.content],
		function(error, result) {
		// insert 실패
		if(error) {
			console.log("Problem Dictionary Insert FAILED!!!");
			retVal = 'no';
		}
		else{
			console.log("Problem Dictionary Insert Success!!!");
			retVal = 'yes';
		}
	});
	return retVal;
};