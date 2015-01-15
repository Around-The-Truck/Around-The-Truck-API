var fs = require('fs');
var mysql = require('mysql');

var g_host = '165.194.35.161';
var g_user = 'food';
var g_password = 'truck';

var trucks = null;
var longitude = null;
var latitude = null;
var addrStr = null;
var truckName = null;

var locationCategory= [{"key":"  신천, 잠실", "value":["신천,","잠실","송파"]}, {"key":"  강남, 양재", "value":["서초","강남","양재"]}, {"key":"  신사, 압구정", "value":["강남","신사","압구정"]}, {"key":"  신촌, 이대, 홍대", "value":["마포","서대문","신촌","이대","홍대","합정","공덕","홍대"]}, {"key":"  이태원", "value":["용산","이태원","경리단"]}, {"key":"  건대", "value":["건대","건국대학교","광진"]}, {"key":"  종로, 명동", "value":["중구","명동","종로","충무로","종각","충정로","을지로"]}];

exports.getTruckList = function(req, res){
	res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});

	// mysql 접속
	var client = mysql.createConnection({
		host: '165.194.35.161',
		user: 'food',
		password: 'truck'
	});

	// json 으로 온 데이터를 파싱.
	// post 로 변경될 때 여기 body 로 변경할 것!
	longitude = req.param('longitude');
	latitude = req.param('latitude');
	addrStr = req.param('addrStr');
	truckName = req.param('truckName');

	// 모든 푸드트럭의 idx, 위치정보(gps, address), 이름을 받아온다.
	client.query('use aroundthetruck');
	client.query('select idx, `name`, phone_num, gps_longitude, gps_latitude, gps_altitude, gps_address, todays_sum, start_yn, start_time, follow_count, (select filename from photo where idx=truck.photo_id) as photo_filename, main_position, (select cat_name from category where idx=truck.category_id) as cat_name_big, (select cat_name from category where idx=truck.category_small) as cat_name_small, takeout_yn, cansit_yn, card_yn, reserve_yn, group_order_yn, always_open_yn, reg_date, open_date from truck',
		function(error, result, fields) {
			if(error) {
				console.log('there\'s error in query!!');
				console.log(error);
			}
			else {
				var jsonStr = '';
				if(result.length==0) {
					jsonStr = '{"code":201}';
					res.end(jsonStr);
				}
				else {
					// 모든 트럭 정보 전역변수에 저장
					result = UTCtoLocal(result, 'start_time');
					result = UTCtoLocal(result, 'reg_date');
					result = UTCtoLocal(result, 'open_date');
					trucks = JSON.stringify(result);
					returnTrucks(res, client);
				}
			}
		}
	);
};

function returnTrucks (res, client) {
	var tt = JSON.parse(trucks);
	var retVal = Array();

	// 1. 이름 검색을 한 경우
		// 트럭이름에 contain 되는지 확인한 후 해당 트럭들을 return 한다.
	if(truckName != null) {
		for(var i=0 ; i<tt.length ; i++) {
			if(tt[i]['name'].indexOf(truckName) > -1) {
				retVal.push(tt[i]);
			}
		}
	}
	// gps정보가 넘어왔고,
	else if(longitude != null && latitude != null) {
		// 사용자로부터의 거리 계산
		for(var i=0 ; i<tt.length ; i++) {
			tt[i]['distFromUser'] = llDist(tt[i]['gps_latitude'], tt[i]['gps_longitude'], latitude, longitude);
		}

		// 2. 위치 검색을 한 경우
			// address 에 contain 되는지 확인한 후 해당 트럭들을 return 한다.
		if(addrStr != null) {
			// 지역 대분류 찾기
			var idxBig = -1;
			for(var i=0 ; i<locationCategory.length ; i++) {
				if(locationCategory[i]['key']==addrStr) {
					idxBig = i;
					break;
				}
			}
			// 대분류를 못찾았다...
			if(idxBig==-1) {
				res.end('{"code":231}');
				return;
			}
			// 모튼 트럭 리스트에서 ...
			for(var i=0 ; i<tt.length ; i++) {
				// 선택된 지역 대분류의 소분류가 들어간 트럭을 선택한다.... 말이 너무 어렵나요? ㅋㅋ
				for(var j=0 ; j<locationCategory[idxBig]['value'].length ; j++) {
					if(tt[i]['gps_address'].indexOf(locationCategory[idxBig]['value'][j]) > -1)
						retVal.push(tt[i]);
				}
			}

			for(var i=0 ; i<retVal.length ; i++) {
				retVal.sort(function(a,b){return a['distFromUser']-b['distFromUser']});
			}
		}
		// 3. gps 정보만 받은 경우
			// req로 넘겨받은 사용자의 위치를 계산한다.
		else {
			tt.sort(function(a,b){return a['distFromUser']-b['distFromUser']});
			// 전부다 푸시
			for(var i=0 ; i<tt.length ; i++)	retVal.push(tt[i]);
		}
	}
	// gps정보가 없는 경우,
	else {
		// 4. gps 없이 위치만 받은 경우
		if(addrStr != null) {
			// 지역 대분류 찾기
			var idxBig = -1;
			console.log('addrStr: '+addrStr);
			for(var i=0 ; i<locationCategory.length ; i++) {
				if(locationCategory[i]['key']==addrStr) {
					idxBig = i;
					break;
				}
			}
			// 대분류를 못찾았다...
			if(idxBig==-1) {
				res.end('{"code":231}');
				return;
			}
			// 모튼 트럭 리스트에서 ...
			for(var i=0 ; i<tt.length ; i++) {
				// 선택된 지역 대분류의 소분류가 들어간 트럭을 선택한다.... 말이 너무 어렵나요? ㅋㅋ
				for(var j=0 ; j<locationCategory[idxBig]['value'].length ; j++) {
					if(tt[i]['gps_address'].indexOf(locationCategory[idxBig]['value'][j]) > -1)
						retVal.push(tt[i]);
				}
			}
		}
		// 5. 아무것도 안넘겼다 - 전부 다 보내기
		else {
			for(var i=0 ; i<tt.length ; i++)	retVal.push(tt[i]);
		}
	}
	jsonStr = '{"code":200,"result":'+JSON.stringify(retVal)+'}';
	res.end(jsonStr);
}

function llDist(lat1, lon1, lat2, lon2) {
	//lat1, lon1은 각각 1번 점의 위도 경도 lat2, lon2는 각각 2번 점의 위도 경도
	//위도 경도를 입력 받아 두 점 사이의 거리를 계산해준다
	if(lat1 == lat2 && lon1 == lon2) return 0;
	var theta, dist;
	theta = lon1 - lon2;
	
	dist = Math.sin(lat1 * Math.PI / 180.0) * Math.sin(lat2 * Math.PI / 180.0);
	dist += Math.cos(lat1 * Math.PI / 180.0) * Math.cos(lat2 * Math.PI / 180.0) * Math.cos(theta * Math.PI / 180.0);
	dist = Math.acos(dist);
	dist = dist * 180.0 / Math.PI;
	dist = dist * 60.0 * 1.1515 * 1609.344;
	return dist;
}

exports.getTruckInfo = function(req, res){
	res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});

	// mysql 접속
	var client = mysql.createConnection({
		host: '165.194.35.161',
		user: 'food',
		password: 'truck'
	});

	// json 으로 온 데이터를 파싱.
	// post 로 변경될 때 여기 body 로 변경할 것!
	truckIdx = req.query.truckIdx;

	if(truckIdx==null) {
		jsonStr = '{"code":203}';
		res.end(jsonStr);
		return;
	}

	client.query('use aroundthetruck');
	client.query('select idx, `name`, phone_num, gps_longitude, gps_latitude, gps_altitude, gps_address, todays_sum, start_yn, start_time, follow_count, (select filename from photo where idx=truck.photo_id) as photo_filename, main_position, (select cat_name from category where idx=truck.category_id) as cat_name_big, (select cat_name from category where idx=truck.category_small) as cat_name_small, takeout_yn, cansit_yn, card_yn, reserve_yn, group_order_yn, always_open_yn, reg_date, open_date from truck where idx='+truckIdx,
		function(error, result, fields) {
			if(error) {
				console.log('there\'s error in query!!');
				console.log(error);
			}
			else {
				var jsonStr = '';
				if(result.length==0) {
					jsonStr = '{"code":204}';
					res.end(jsonStr);
				}
				else {
					result = UTCtoLocal(result, 'start_time');
					result = UTCtoLocal(result, 'reg_date');
					result = UTCtoLocal(result, 'open_date');
					jsonStr = '{"code":200,"result":'+JSON.stringify(result)+'}';
					res.end(jsonStr);
				}
			}
		}
	);
};

exports.getTruckShort = function(req, res){
	res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});

	// mysql 접속
	var client = mysql.createConnection({
		host: '165.194.35.161',
		user: 'food',
		password: 'truck'
	});

	// json 으로 온 데이터를 파싱.
	// post 로 변경될 때 여기 body 로 변경할 것!
	truckIdx = req.param('truckIdx');

	if(truckIdx==undefined) {
		jsonStr = '{"code":203}';
		res.end(jsonStr);
		return;
	}

	if(truckIdx.length==0) {
		res.end('{"code":214}');
		return;
	}

	client.query('use aroundthetruck');
	client.query('select idx, `name`, (select filename from photo where idx=truck.photo_id) as photo_filename from truck where idx='+truckIdx,
		function(error, result, fields) {
			if(error) {
				console.log('there\'s error in query!!');
				console.log(error);
			}
			else {
				var jsonStr = '';
				if(result.length==0) {
					jsonStr = '{"code":204}';
					res.end(jsonStr);
				}
				else {
					jsonStr = '{"code":200,"result":'+JSON.stringify(result)+'}';
					res.end(jsonStr);
				}
			}
		}
	);
};

exports.truckStart = function(req, res) {
	res.writeHead(200, {'Content-Type':'json;charset=utf-8'});
	
	var truckIdx = req.param('idx');
	var truckLat = req.param('lat');
	var truckLng = req.param('lng');

	if(truckIdx==undefined || truckLat==undefined || truckLng==undefined) {
		res.end('{"code":209}');
		return;
	}
	else if(truckIdx.length==0 || truckLat.length==0 || truckLng.length==0) {
		res.end('{"code":210}');
		return;
	}

	// mysql 접속
	var client = mysql.createConnection({
		host: '165.194.35.161',
		user: 'food',
		password: 'truck'
	});

	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query('select * from truck where idx=?',
		[truckIdx],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":211}');
				return;
			}
			else {
				if(result.length==0) {
					res.end('{"code":201}');
					return;
				}
				else if(result[0]['start_yn']=='1') {
					res.end('{"code":212}');
					return;
				}
				else {
					// update
					truckStartUpdate(req, res, client, truckIdx, truckLat, truckLng);
					return;
				}
				
			}
		}
	);
};

function truckStartUpdate(req, res, client, truckIdx, truckLat, truckLng) {
	client.query('UPDATE `aroundthetruck`.`truck` SET `gps_longitude`=?, `gps_latitude`=?, `start_yn`=\'1\', `start_time`=NOW() WHERE `idx`=?',
		[truckLng, truckLat, truckIdx],
		function(error, result) {
			if(error) {
				res.end('{"code":204}');
				return;
			}
			else {
				res.end('{"code":205}');
				return;
			}
	});
}
	

exports.truckEnd = function(req, res) {
	res.writeHead(200, {'Content-Type':'json;charset=utf-8'});
	
	var truckIdx = req.param('idx');

	if(truckIdx==undefined) {
		res.end('{"code":209}');
		return;
	}
	else if(truckIdx.length==0) {
		res.end('{"code":210}');
		return;
	}
	// mysql 접속
	var client = mysql.createConnection({
		host: '165.194.35.161',
		user: 'food',
		password: 'truck'
	});

	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query('select * from truck where idx=?',
		[truckIdx],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":211}');
				return;
			}
			else {
				if(result.length==0) {
					res.end('{"code":201}');
					return;
				}
				else if(result[0]['start_yn']=='0') {
					res.end('{"code":213}');
					return;
				}
				else {
					// update
					truckEndUpdate(req, res, client, truckIdx);
					return;
				}
				
			}
		}
	);
};

function truckEndUpdate(req, res, client, truckIdx) {
	client.query('UPDATE truck SET `start_yn`=0 WHERE `idx`=?',
		[truckIdx],
		function(error, result) {
			if(error) {
				res.end('{"code":206}');
				return;
			}
			else {
				insertOpenHistory(client, res, truckIdx);
				return;
			}
	});
}

var insertOpenHistory = function(client, res, idx) {
	client.query('insert into open_history (truckIdx, start, end) values ('+idx+', (select start_time from truck where idx='+idx+'), NOW())',
		[idx],
		function(error, result) {
			// insert 실패
			if(error) {
				jsonStr = '{"code":207}';
				res.end(jsonStr);
			}
			// insert 성공	
			else {
				jsonStr = '{"code":208}';
				res.end(jsonStr);
			}
	});
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

exports.followTruck = function(req, res) {
// num 받는다.
res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});

	truckIdx = req.param('truckIdx');
	phoneNum = req.param('phoneNum');

	if(truckIdx==undefined || phoneNum==undefined) {
		res.end('{"code":501}');
		return;
	}
	else if(truckIdx.length==0 || phoneNum.length==0) {
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
	client.query('select * from truck where idx=?',
		[truckIdx],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":503}');
				return;
			}
			else {
				if(result.length==0) {
					res.end('{"code":509}');
					return;		
				}
				else {
					followTruckSelect(req, res, client, truckIdx, phoneNum);
				}
			}
		}
	);
};
function followTruckSelect(req, res, client, truckIdx, phoneNum) {
	client.query('select * from aroundthetruck.follow_list where customer=? and tidx=?',
		[phoneNum, truckIdx],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":503}');
				return;
			}
			// 팔로우를 안했으므로 팔로우를 누른다. update & insert
			else if(result.length==0) {
				followTruckUpdate(req, res, client, truckIdx, phoneNum);
				return;
			}
			// 이미 팔로우를 눌렀다.
			else if(result.length==1) {
				res.end('{"code":507}');
				return;
			}
			// 그 외 디비 무결성 파괴의 경우...
			else {
				res.end('{"code":508}');
				return;
			}
		}
	);
}

function followTruckUpdate(req, res, client, truckIdx, phoneNum) {
	client.query('update aroundthetruck.truck set `follow_count`=`follow_count`+1 where idx=?',
		[truckIdx],
		function(error, result) {
			if(error) {
				res.end('{"code":510}');
				return;
			}
			else {
				followTruckInsert(req, res, client, truckIdx, phoneNum);
				return;
			}
	});
}

function followTruckInsert(req, res, client, truckIdx, phoneNum) {
	client.query('INSERT INTO `aroundthetruck`.`follow_list` (`customer`, `tidx`) VALUES (?, ?)',
		[phoneNum, truckIdx],
		function(err, result) {
			if(err) {
				res.end('{"code":506}');
				return;
			}
			else {
				res.end('{"code":500}');
				return;
			}
		}
	);
}

exports.unfollowTruck = function(req, res) {
res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});

	truckIdx = req.param('truckIdx');
	phoneNum = req.param('phoneNum');

	if(truckIdx==undefined || phoneNum==undefined) {
		res.end('{"code":501}');
		return;
	}
	else if(truckIdx.length==0 || phoneNum.length==0) {
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
	client.query('select * from truck where idx=?',
		[truckIdx],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":503}');
				return;
			}
			else {
				if(result.length==0) {
					res.end('{"code":509}');
					return;		
				}
				else {
					unfollowTruckSelect(req, res, client, truckIdx, phoneNum);
				}
			}
		}
	);
};
function unfollowTruckSelect(req, res, client, truckIdx, phoneNum) {
	client.query('select * from aroundthetruck.follow_list where customer=? and tidx=?',
		[phoneNum, truckIdx],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":503}');
				return;
			}
			// 애초에 팔로우를 안했다.
			else if(result.length==0) {
				res.end('{"code":511}');
				return;
			}
			// 팔로우를 해제. update & insert
			else if(result.length==1) {
				zeroCheck(req, res, client, truckIdx, phoneNum);
				return;
			}
			// 그 외 디비 무결성 파괴의 경우...
			else {
				res.end('{"code":508}');
				return;
			}
		}
	);
}

function zeroCheck (req, res, client, truckIdx, phoneNum) {
	client.query('select if ((select `follow_count` from truck where idx=?)=0, "zero", "non-zero") as retVal',
		[truckIdx],
		function (error, result, fields) {
			if(error) {
				res.end('{"code":512}');
				return;
			}
			// count down 하려 봤더니 이미 0이다... 
			else if (result[0]['retVal']=="zero") {
				// 바로 delete 작업을 실행
				console.log("goto delete directly (truck)");
				unfollowTruckDelete(req, res, client, truckIdx, phoneNum);
			}
			else {
				unfollowTruckUpdate(req, res, client, truckIdx, phoneNum);
				return;
			}
		}
	);
}

function unfollowTruckUpdate(req, res, client, truckIdx, phoneNum) {
	client.query('update aroundthetruck.truck set `follow_count`=`follow_count`-1 where idx=?',
		[truckIdx],
		function(error, result) {
			if(error) {
				res.end('{"code":510}');
				return;
			}
			else {
				unfollowTruckDelete(req, res, client, truckIdx, phoneNum);
				return;
			}
	});
}

function unfollowTruckDelete(req, res, client, truckIdx, phoneNum) {
	client.query('delete from `aroundthetruck`.`follow_list` where `customer`=? and `tidx`=?',
		[phoneNum, truckIdx],
		function(err, result) {
			if(err) {
				res.end('{"code":506}');
				return;
			}
			else {
				res.end('{"code":500}');
				return;
			}
		}
	);
}

exports.getMenuList = function(req, res){
	res.writeHead(200, {'Content-Type': 'application/json;charset=utf-8'});

	// mysql 접속
	var client = mysql.createConnection({
		host: '165.194.35.161',
		user: 'food',
		password: 'truck'
	});

	// json 으로 온 데이터를 파싱.
	// post 로 변경될 때 여기 body 로 변경할 것!
	truckIdx = req.param('truckIdx');

	if(truckIdx==null) {
		jsonStr = '{"code":203}';
		res.end(jsonStr);
		return;
	}

	client.query('use aroundthetruck');
	client.query('SELECT idx, name, price, truck_idx, (select name from truck where truck.idx=menu.truck_idx) as truck_name, (select photo.filename from photo where photo.idx=menu.photo_idx) as photo_filename, description, ingredients FROM menu where truck_idx=?',
		[truckIdx],
		function(error, result, fields) {
			if(error) {
				res.end('{"code":215}');
				return;
			}
			else {
				jsonStr = '{"code":200,"result":'+JSON.stringify(result)+'}';
				res.end(jsonStr);

			}
		}
	);
};

exports.addMenuList = function(req, res){
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});
	try
	{
		var raw = req.param('data');
		// data 에는
		// name, price, description, ingredients 가 들어가야됨.
		var truckIdx = req.param('truckIdx');

		if(raw==undefined || truckIdx==undefined) {
			res.end('{"code":203}');
			return;
		}
		if(raw.length==0 || truckIdx.length==0) {
			res.end('{"code":217}');
			return;
		}
		// json 으로 파싱.
		try {
			raw = JSON.parse(raw);
		}
		catch(e) {
			res.end('{"code":218}');
			return;
		}

		var menuData = raw;
		// data valid check
		for(var i=0 ; i<menuData.length ; i++) {
			if(menuData[i]['name']==undefined || menuData[i]['price']==undefined) {
				res.end('{"code":220}');
				return;
			}
			else if(menuData[i]['name'].length==0 || menuData[i]['price'].length==0) {
				res.end('{"code":221}');
				return;	
			}
		}

		var fileData = Array();

		for(var i=0 ; i<menuData.length ; i++) {
			// fileData valid check
			if(eval("req.files.file"+i)==undefined) {
				res.end('{"code":219}');
				return;
			}
			else if(!(eval("req.files.file"+i).name)) {
				res.end('{"code":223}');
				return;
			}
			fileData.push(eval("req.files.file"+i));
		}
		/*
		[{"photoFieldName":"file0", "name":"menu1", "price":"1000", "description":"desdes", "ingredients":"one, two, three"},{"photoFieldName":"file1", "name":"menu2", "price":"1000", "description":"desdes", "ingredients":"one, two, three"}]
		*/
		uploadImage(res, fileData, menuData, truckIdx);
		return;
	}
	catch (err)	{
		res.end('{"code":225}');
		return;
	}
};

var uploadImage = function(res, fileData, menuData, truckIdx) {
	var realFileName = Array();

	// 파일 읽기
	for(var i=0 ; i<fileData.length ; i++) {
		try {
			var data = fs.readFileSync(fileData[i].path);
			var path = __dirname + "/../public/upload/";
			var fileName = fileData[i].name;

			if(!fileName){
		        res.end('{"code":223}');
		        return ;
		    }

	        while(fs.existsSync(path+fileName))
	        	fileName = "_" + fileName;

	        try {
	        	var writeResult = fs.writeFileSync(path+fileName, data);
	        	realFileName.push(fileName);
	        } catch (ee) {
	        	res.end('{"code":224}');
				return ;
	        }
		} catch (e) {
			res.end('{"code":222}');
			return ;
		}	
	}
	
	insertRowImage(res, realFileName, menuData, truckIdx);
	return;
};

var insertRowImage = function(res, fileName, menuData, truckIdx) {

	var client = mysql.createConnection({
		host: '165.194.35.161',
		user: 'food',
		password: 'truck'
	});

	var queryStr = "INSERT INTO photo ( publisher, publisher_type, filename ) VALUES ";
	for(var i=0 ; i<fileName.length ; i++) {
		queryStr += "('"+truckIdx+"', "+1+", '"+fileName[i]+"'),";
	}
	queryStr = queryStr.substring(0, queryStr.length-1);

	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query(queryStr,
		function(error, result) {
			if(error) {
				res.end('{"code":226}');
				// TODO: 파일 지우기 : removeFile(fileName)
				return;
			}
			else {
				getPhotoIdxes(client, res, fileName, menuData, truckIdx);
				return;
			}
		}
	);
}

function getPhotoIdxes (client, res, fileName, menuData, truckIdx) {
	var fileIdx = Array();
	var queryStr = "SELECT idx FROM photo where filename in (";
	for(var i=0 ; i<fileName.length ; i++) {
		queryStr += "'"+fileName[i]+"',";
	}
	queryStr = queryStr.substring(0, queryStr.length-1);
	queryStr += ")";

	client.query(queryStr,
		function(error, result, fields) {
			if(error) {
				res.end('{"code":227}');
				return;
			}
			else {
				if(result.length != fileName.length) {
					res.end('{"code":228}');
					return;
				}
				else {
					for(var i=0 ; i<result.length ; i++) {
						fileIdx.push(result[i]['idx']);
					}
				}
				insertRowMenu(client, res, fileName, fileIdx, menuData, truckIdx);
				return;
				// jsonStr = '{"code":200,"result":'+JSON.stringify(result)+'}';
				// res.end(jsonStr);
			}
		}
	);
}

var insertRowMenu = function(client, res, fileName, fileIdx, menuData, truckIdx) {
	//insert into menu (`name`, `price`, `truck_idx`, `photo_idx`, `description`, `ingredients`) values ('aaa','123','5','12','asdf','qwer'),('aaa','123','5','12','asdf','qwer');
	var queryStr = "insert into menu (`name`, `price`, `truck_idx`, `photo_idx`, `description`, `ingredients`) values ";
	for(var i=0 ; i<fileName.length ; i++) {
		queryStr += "('"+menuData[i]['name']+"', '"+menuData[i]['price']+"', '"+truckIdx+"', '"+fileIdx[i]+"', '"+menuData[i]['description']+"', '"+menuData[i]['ingredients']+"'),";
	}
	queryStr = queryStr.substring(0, queryStr.length-1);
	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query(queryStr,
		function(error, result) {
			if(error) {
				res.end('{"code":229}');
				return;
			}
			else {
				res.end('{"code":230}');
				return;
			}
		}
	);
};