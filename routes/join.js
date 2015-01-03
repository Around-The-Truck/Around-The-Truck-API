var fs = require('fs');
var mysql = require('mysql');


var nick_result=0;

var email = null;
var pw = null;
var nick = null;

////////////////// new 
var g_host = '165.194.35.161';
var g_user = 'food';
var g_pw = 'truck';

var userName = null;
var age = null;
var gender = null;
var job = null;
var phone = null;

var phone_result=0;

/////// truck Join 관련 ///////
g_truck_idx = null;
g_truck_truckName = null;
g_truck_phone = null;
g_truck_openDate = null;
g_truck_file = null;

g_truck_category_small = null;
g_truck_category_big = null;
g_truck_takeout_yn = null;
g_truck_cansit_yn = null;
g_truck_card_yn = null;
g_truck_reserve_yn = null;
g_truck_group_order_yn = null;
g_truck_always_open_yn = null;

exports.join = function(req, res){
	//res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});
	try
	{
		// json 으로 온 데이터를 파싱.
		userName = req.param('userName');
		age = req.param('age');
		gender = req.param('gender');
		job = req.param('job');
		phone = req.param('phone');
		
		console.log("input userName: "+userName);
		console.log("input age: "+age);
		console.log("input gender: "+gender);
		console.log("input job: "+job);
		console.log("input phone: "+phone);

		// db 에서 찾기
		var client = mysql.createConnection({
			host: g_host,
			user: g_user,
			password: g_pw
		});

		// db 접속
		
		email_result=0;
		nick_result=0;
		client.query('use aroundthetruck');
		client.query('set names utf8');
		client.query('select * from customer where phone=?',
			[phone],
			function(error, result, fields) {
				if(error) {
					console.log('there\'s error in query!!');
					console.log('ErrMsg: '+ error);
				}
				else {
					console.log('Phone Overlap Test');
					console.log(JSON.stringify(result));
					// 있는지 없는지 case dealing
					console.log('result.length = '+result.length);
					phone_result = result.length;
					// phone 중복 안 됨
					if(result.length==0) {
						console.log('Phone not overlapped');
					}
					// phone 중복됨
					else {
						console.log('Phone overlapped');
					}
					insertRow(client, res);
				}
		});
	}
	catch (err)	{	console.log(err);	}
};

exports.phoneOverlapCheck = function(req, res) {
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});
	phone = req.param('phone');

	// mysql 에서 찾기
	var client = mysql.createConnection({
		host: g_host,
		user: g_user,
		password: g_pw
	});

	// db 접속
	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query('select * from customer where phone=?',
		[email],
		function(error, result, fields) {
			if(error) {
				console.log('there\'s error in query!!');
				console.log('ErrMsg: '+ error);
			}
			else {
				console.log('Phone Overlap Test');
				console.log(JSON.stringify(result));
				// 있는지 없는지 case dealing
				console.log('result.length = '+result.length);

				// phone 중복 안 됨
				if(result.length==0) {
					console.log('Phone not overlapped');
					jsonStr = '{"code":105}';
					res.end(jsonStr);
					return;

				}
				// phone 중복됨
				else {
					console.log('Phone overlapped');
					jsonStr = '{"code":103}';
					res.end(jsonStr);
					return;
				}
			}
	});
};

var insertRow = function(client, res) {
	if(phone_result==0){
		// db에 insert
		client.query('INSERT INTO customer (`name`, `phone`, `gender`, `age`, `reg_date`) VALUES (?, ?, ?, ?, NOW())',
			[userName, phone, gender, age],
			function(error, result) {
				// insert 실패
				if(error) {
					jsonStr = '{"code":102}';
					res.end(jsonStr);
					return;
				}
				// insert 성공	
				else {
					jsonStr = '{"code":101}';
					res.end(jsonStr);
					return;
				}
		});
	}
	// 이미 phone이 존재하는 경우 (error)
	else{
		jsonStr = '{"code":103}';
		res.end(jsonStr);
		return;
	}
};

exports.truckNumCheck = function(req, res) {
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});
	num = req.param('num');

	// valid numeric check
	if(num==null || isNaN(parseInt(num))  || !isFinite(num)) {
		res.end('{"code":107}');
		return ;
	}



	// mysql 에서 찾기
	var client = mysql.createConnection({
		host: g_host,
		user: g_user,
		password: g_pw
	});

	// db 접속
	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query('select * from truck where idx=?',
		[num],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":108}');
				return;
			}
			else {
				if(result.length==0) {
					res.end('{"code":109}');
					return;
				}
				else if(result.length==1) {
					res.end('{"code":110}');
					return;
				}
				else {
					res.end('{"code":111}');
					return;
				}
			}
	});
};

exports.truckJoin = function(req, res){
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});
	try
	{
		// json 으로 온 데이터를 파싱.
		var idx = req.param('idx');
		var truckName = req.param('truckName');
		var phone = req.param('phone');
		var openDate = req.param('open_date');
		var profileImg = req.files.file;

		var category_big = req.param('category_big');
		var category_small = req.param('category_small');
		var takeout_yn = req.param('takeout_yn');
		var cansit_yn = req.param('cansit_yn');
		var card_yn = req.param('card_yn');
		var reserve_yn = req.param('reserve_yn');
		var group_order_yn = req.param('group_order_yn');
		var always_open_yn = req.param('always_open_yn');

		// 텍스트 데이터
		// 아예 없을때는 undefined 이고, ! 로 검출 가능.
		// 빈칸일때는 undefined가 아니고, ! 로 검출 가능하고, length==0 으로 검출 가능.

		// 파일
		// 아예 없을때는 undefined 이고, ! 로 검출 가능.
		// 빈칸일때는 undefined가 아니고, ! 로 검출 불가능하고, name의 length 로만 검출 가능.

		// undefined check
		if(idx==undefined || truckName==undefined || phone==undefined 
			|| openDate==undefined || profileImg==undefined
			|| category_big==undefined || category_small==undefined 
			|| takeout_yn==undefined || cansit_yn==undefined || card_yn==undefined 
			|| reserve_yn==undefined || group_order_yn==undefined || always_open_yn==undefined) {
			res.end('{"code":117}');
			return;
		}

		// 프로필 사진 체크
		if(!profileImg.name) {
			res.end('{"code":118}');
			return;
		}
		
		// 빈칸 정보 체크
		//if(idx.length==0 || truckName.length==0 || phone.length==0 || openDate.length==0) {
		if(idx.length==0 || truckName.length==0 || phone.length==0
			|| openDate.length==0 || category_small.length==0 || category_big.length==0
			|| takeout_yn.length==0 || cansit_yn.length==0 || card_yn.length==0
			|| reserve_yn.length==0 || group_order_yn.length==0 || always_open_yn.length==0) {
			res.end('{"code":119}');
			return;
		}

		g_truck_idx = idx;
		g_truck_truckName = truckName;
		g_truck_phone = phone;
		g_truck_openDate = openDate;
		g_truck_file = profileImg;

		g_truck_category_small = category_small;
		g_truck_category_big = category_big;
		g_truck_takeout_yn = takeout_yn;
		g_truck_cansit_yn = cansit_yn;
		g_truck_card_yn = card_yn;
		g_truck_reserve_yn = reserve_yn;
		g_truck_group_order_yn = group_order_yn;
		g_truck_always_open_yn = always_open_yn;

		// db 에서 찾기
		var client = mysql.createConnection({
			host: g_host,
			user: g_user,
			password: g_pw
		});
		client.query('use aroundthetruck');
		client.query('set names utf8');
		client.query('select name from truck where idx=?',
			[idx],
			function(error, result, fields) {
				if(error) {
					res.end('{"code":113}');
					return;
				}
				else {
					if(result.length==0 || result.length>1) {
						res.end('{"code":114}');
						return;
					}
					else if(result.length==1 && result[0]['name']!=null) {
						res.end('{"code":115}');
						return;
					}
					else if(result.length==1 && result[0]['name']==null) {
						uploadImage(client, res);
					}
					else {
						res.end('{"code":116}');
						return;
					}
				}
		});
	}
	catch (err)	{	console.log(err);	}
};

var uploadImage = function(client, res) {
	// 파일 업로드
	var fileName = g_truck_file.name;
	fs.readFile(g_truck_file.path, function (err, data) {
        

        if(!fileName){
            res.end('{"code":118}');
            return ;
        }
        else {
        	var path = __dirname + "/../public/upload/";

            while(fs.existsSync(path+fileName))
            	fileName = "_" + fileName;

            fs.writeFile(path+fileName, data, function (err) {
            	if(err) {
            		res.end('{"code":120}');
            		return;
            	}
                
            });
        }
    });
    insertRowImage(client, res, fileName);
	//insertRowTruck(client, res, fileName);
};

var insertRowImage = function(client, res, fileName) {
	client.query('insert into photo (`publisher`, `publisher_type`, `filename`) values (?,?,?)',
		[g_truck_idx, 1, fileName],
		function(error, result) {
			if(error) {
				res.end('{"code":121}');
				// TODO: 파일 지우기 : removeFile(fileName)
				return;
			}
			else {
				insertRowTruck(client, res, result.insertId);
			}
		}
	);
}

var insertRowTruck = function(client, res, photoIdx) {
	client.query('UPDATE `aroundthetruck`.`truck` SET `name`=?, `phone_num`=?, `start_yn`=?, `follow_count`=?, `photo_id`=?, `category_id`=?, `category_small`=?, `takeout_yn`=?, `cansit_yn`=?, `card_yn`=?, `reserve_yn`=?, `group_order_yn`=?, `always_open_yn`=?, `reg_date`=NOW(), `open_date`=? WHERE `idx`=?',	
		[g_truck_truckName, g_truck_phone, 0, 0, photoIdx, g_truck_category_big, g_truck_category_small, g_truck_takeout_yn, g_truck_cansit_yn, g_truck_card_yn, g_truck_reserve_yn, g_truck_group_order_yn, g_truck_always_open_yn, g_truck_openDate, g_truck_idx],
		function(err, result) {
			if(err) {
				res.end('{"code":122}');
				return;
			}
			else {
				res.end('{"code":123}');
				return;
			}
		}
	);
};