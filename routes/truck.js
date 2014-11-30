
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
	longitude = req.query.longitude;
	latitude = req.query.latitude;
	addrStr = req.query.addrStr;
	truckName = req.query.truckName;

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
					jsonStr = '["code":201]';
					res.end(jsonStr);
				}
				else {
					// 모든 트럭 정보 전역변수에 저장
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
		// 2. 위치 검색을 한 경우
			// address 에 contain 되는지 확인한 후 해당 트럭들을 return 한다.
		if(addrStr != null) {

		}
		// 3. gps 정보만 받은 경우
			// req로 넘겨받은 사용자의 위치를 계산한다.
		else {

		}
	}
	// gps정보가 없는 경우,
	else {
		// 4. gps 없이 위치만 받은 경우
		if(addrStr != null) {

		}
		// 5. error!
		else {
			res.end('["code":202]');
		}
	}
	jsonStr = '["code":200,"result":'+JSON.stringify(retVal)+']';
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