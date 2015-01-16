var fs = require('fs');
var mysql = require('mysql');

var email = null;

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
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});
	try
	{
		var userName = req.param('userName');
		var birth = req.param('birth');
		var gender = req.param('gender');	//남자1, 여자2
		var phone = req.param('phone');
		// json 으로 온 데이터를 파싱.

		console.log("username: "+userName+", type is "+typeof(userName));
		console.log("birth: "+birth+", type is "+typeof(birth));
		console.log("gender: "+gender+", type is "+typeof(gender));
		console.log("phone: "+phone+", type is "+typeof(phone));
		console.log('before profileImg');
		var profileImg = req.files.file;
		console.log('after profileImg');

		// 텍스트 데이터
		// 아예 없을때는 undefined 이고, ! 로 검출 가능.
		// 빈칸일때는 undefined가 아니고, ! 로 검출 가능하고, length==0 으로 검출 가능.

		// 파일
		// 아예 없을때는 undefined 이고, ! 로 검출 가능.
		// 빈칸일때는 undefined가 아니고, ! 로 검출 불가능하고, name의 length 로만 검출 가능.

		// undefined check
		if(userName==undefined || birth==undefined || gender==undefined || phone==undefined) {
			res.end('{"code":117}');
			return;
		}

		console.log('before if');
		// 프로필 사진 체크
		if(!profileImg.name) {
			console.log('inner if');
			res.end('{"code":118}');
			return;
		}
		console.log('after if');
		// 빈칸 정보 체크
		if(userName.length==0 || birth.length==0 || gender.length==0 || phone.length==0) {
			res.end('{"code":119}');
			return;
		}
	
		// db 에서 찾기
		var client = mysql.createConnection({
			host: g_host,
			user: g_user,
			password: g_pw
		});
		client.query('use aroundthetruck');
		client.query('set names utf8');
		client.query('select phone from customer where phone=?',
			[phone],
			function(error, result, fields) {
				if(error) {
					res.end('{"code":101}');
					client.end();
					return;
				}
				else {
					if(result.length==0) {
						uploadImageCustomer (client, res, userName, birth, gender, phone, profileImg);
					}
					else if (result.length==1) {
						res.end('{"code":102}');
						client.end();
						return;
					}
					else {
						res.end('{"code":103}');
						client.end();
						return;	
					}
				}
		});
	}
	catch (err)	{	console.log(err);	}
};

var uploadImageCustomer = function (client, res, userName, birth, gender, phone, profileImg) {
	console.log('uploadImagecustomer');
	// 파일 업로드
	var fileName = profileImg.name;
	fs.readFile(profileImg.path, function (err, data) {
        
        if(!fileName){
            res.end('{"code":118}');
            client.end();
            return ;
        }
        else {
        	var path = __dirname + "/../public/upload/";

            while(fs.existsSync(path+fileName))
            	fileName = "_" + fileName;

            fs.writeFile(path+fileName, data, function (err) {
            	if(err) {
            		res.end('{"code":120}');
            		client.end();
            		return;
            	}
            });
        }
    });
    insertRowImageCustomer (client, res, userName, birth, gender, phone, fileName);
};

var insertRowImageCustomer = function (client, res, userName, birth, gender, phone, fileName) {
	client.query('insert into photo (`publisher`, `publisher_type`, `filename`) values (?,?,?)',
		[phone, 0, fileName],
		function(error, result) {
			if(error) {
				res.end('{"code":121}');
				client.end();
				// TODO: 파일 지우기 : removeFile(fileName)
				return;
			}
			else {
				insertRowCustomer (client, res, result.insertId, userName, birth, gender, phone);
				return;
			}
		}
	);
}

var insertRowCustomer = function (client, res, photo_id, userName, birth, gender, phone) {
	var age = new Date(birth);
	if(isNaN(age)) {
		res.end('{"code":104}');
		client.end();
		return;
	}
	var today = new Date();
	age = today.getFullYear() - age.getFullYear() + 1;

	client.query('INSERT INTO `aroundthetruck`.`customer` (`name`, `phone`, `gender`, `age`, `point`, `photo_profile`, `reg_date`) VALUES (?, ?, ?, ?, ?, ?, NOW())',
		[userName, phone, gender, age, 0, photo_id],
		function(err, result) {
			if(err) {
				res.end('{"code":105}');
				client.end();
				return;
			}
			else {
				res.end('{"code":100}');
				client.end();
				return;
			}
		}
	);
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
				client.end();
				return;
			}
			else {
				if(result.length==0) {
					res.end('{"code":109}');
				}
				else if(result.length==1) {
					res.end('{"code":110}');
				}
				else {
					res.end('{"code":111}');
				}
				client.end();
				return;
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
					client.end();
					return;
				}
				else {
					if(result.length==0 || result.length>1) {
						res.end('{"code":114}');
						client.end();
						return;
					}
					else if(result.length==1 && result[0]['name']!=null) {
						res.end('{"code":115}');
						client.end();
						return;
					}
					else if(result.length==1 && result[0]['name']==null) {
						uploadImage(client, res);
					}
					else {
						res.end('{"code":116}');
						client.end();
						return;
					}
				}
		});
	}
	catch (err)	{	
		console.log(err);	
		if(client!=undefined)	client.end();
	}
};

var uploadImage = function(client, res) {
	// 파일 업로드
	var fileName = g_truck_file.name;
	fs.readFile(g_truck_file.path, function (err, data) {
        

        if(!fileName){
            res.end('{"code":118}');
            client.end();
            return ;
        }
        else {
        	var path = __dirname + "/../public/upload/";

            while(fs.existsSync(path+fileName))
            	fileName = "_" + fileName;

            fs.writeFile(path+fileName, data, function (err) {
            	if(err) {
            		res.end('{"code":120}');
            		client.end();
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
				client.end();
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
	client.query('UPDATE `aroundthetruck`.`truck` SET `name`=?, `phone_num`=?, `todays_sum`=?, `start_yn`=?, `follow_count`=?, `photo_id`=?, `category_id`=?, `category_small`=?, `takeout_yn`=?, `cansit_yn`=?, `card_yn`=?, `reserve_yn`=?, `group_order_yn`=?, `always_open_yn`=?, `reg_date`=NOW(), `open_date`=? WHERE `idx`=?',	
		[g_truck_truckName, g_truck_phone, 0, 0, 0, photoIdx, g_truck_category_big, g_truck_category_small, g_truck_takeout_yn, g_truck_cansit_yn, g_truck_card_yn, g_truck_reserve_yn, g_truck_group_order_yn, g_truck_always_open_yn, g_truck_openDate, g_truck_idx],
		function(err, result) {
			if(err) {
				res.end('{"code":122}');
				client.end();
				return;
			}
			else {
				res.end('{"code":123}');
				client.end();
				return;
			}
		}
	);
};
