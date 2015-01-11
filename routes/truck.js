
var mysql = require('mysql');


var trucks = null;
var longitude = null;
var latitude = null;
var addrStr = null;
var truckName = null;


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
	client.query('select * from truck',
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
			for(var i=0 ; i<tt.length ; i++) {
				if(tt[i]['gps_address'].indexOf(addrStr) > -1)	retVal.push(tt[i]);
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
			for(var i=0 ; i<tt.length ; i++) {
				if(tt[i]['gps_address'].indexOf(addrStr) > -1)	retVal.push(tt[i]);
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
	client.query('select idx, `name`, phone_num, gps_longitude, gps_latitude, gps_altitude, gps_address, todays_sum, start_yn, start_time, follow_count, (select filename from photo where idx=truck.photo_id) as photo_filename, main_position, category_id, category_small, takeout_yn, cansit_yn, card_yn, reserve_yn, group_order_yn, always_open_yn, reg_date, open_date from truck where idx='+truckIdx,
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