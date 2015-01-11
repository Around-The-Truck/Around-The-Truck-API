var mysql = require('mysql');

var g_host = '165.194.35.161';
var g_user = 'food';
var g_pw = 'truck';

exports.pay = function (req, res) {
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});

	res.end("zzz");
	return;

};

exports.calculate = function (req, res) {
	res.writeHead(200, {'Content-Type':'application/json;charset=utf-8'});

	truckIdx = req.param('truckIdx');
	// optional
	inputDate = req.param('inputDate');

	if(truckIdx==undefined) {
		res.end('{"code":701}');
		return;
	}
	else if(truckIdx.length==0) {
		res.end('{"code":702}');
		return;
	}

	var client = mysql.createConnection({
		host: g_host,
		user: g_user,
		password: g_pw
	});

	client.query('use aroundthetruck');
	client.query('set names utf8');
	client.query('select * from open_history where truckIdx=?',
		[truckIdx],
		function (error, result_open_history, fields) {
			if (error) {
				res.end('{"code":703}');
				return;
			}
			else {
				getMoreInfo(res, req, client, result_open_history, truckIdx);
				return;
			}
		}
	);

/*
	날짜, 요일		그냥
	영업시간		그냥
	총매출		그냥
	(날씨)		
	1인당 평균매출	buy_history, customer

	연령			함수한개더	b, c
	성별			함수한개더	b, c
	메뉴순위		함수한개더	b, m

	시간대별
	*/
};

function getMoreInfo (res, req, client, result_open_history, truckIdx) {
	if (result_open_history.length==0) {
		jsonStr = '{"code":700,"result":'+JSON.stringify(result_open_history)+'}';
		res.end(jsonStr);
		return;
	}

	client.query('select idx, group_idx, menu_idx, (select name from menu where idx=buy_history.menu_idx) as menu_name, price as paid, customer_phone, (select age from customer where phone=buy_history.customer_phone) as customer_age, (select gender from customer where phone=buy_history.customer_phone) as customer_gender, reg_date from buy_history where truck_idx=?',
		[truckIdx],
		function (error, result_buy_history, fields) {
			if (error) {
				res.end('{"code":703}');
				return;
			}
			else {
				assemble(res, req, client, result_open_history, result_buy_history, truckIdx);
				return;
			}
		}
	);
}

function assemble (res, req, client, result_open_history, result_buy_history, truckIdx) {

	// history 배열 생성
	for(var i=0 ; i<result_open_history.length ; i++) {
		result_open_history[i]['history'] = Array();
	}

	// 알맞은 open_history 에 buy_history 를 집어넣는다.
	for(var i=0 ; i<result_buy_history.length ; i++) {
		for(var j=0 ; j<result_open_history.length ; j++) {
			if(result_open_history[j]['start'] <= result_buy_history[i]['reg_date'] && result_open_history[j]['end'] >= result_buy_history[i]['reg_date']) {
				result_open_history[j]['history'].push(result_buy_history[i]);
				break;
			}
		}
	}
	// 정산 사항들 계산
	//open_history: truckIdx, start, end, todays_sum
	//buy_history: idx, group_idx, menu_idx, menu_name, paid, 
	// 				customer_phone, customer_age, customer_gender, reg_date
	for(var i=0 ; i<result_open_history.length ; i++) {
		var people = Array();
		var age = Array(0,0,0,0,0,0,0,0,0,0);
		var cntMale = 0;
		var cntFemale = 0;

		var menuIdxArr = Array();
		var menuCntArr = Array();
		var menuNameArr = Array();

		for(var j=0 ; j<result_open_history[i]['history'].length ; j++) {
			// 성별
			if(result_open_history[i]['history'][j]['customer_gender']==1)
				cntMale++;
			else
				cntFemale++;

			// 연령대
			age[parseInt(result_open_history[i]['history'][j]['customer_age']/10,10)]++;

			// 손님 수 계산
			if(people.indexOf(result_open_history[i]['history'][j]['customer_phone'])==-1) {
				people.push(result_open_history[i]['history'][j]['customer_phone']);
			}

			// 메뉴 관련
			idxof = menuNameArr.indexOf(result_open_history[i]['history'][j]['menu_name']);
			if(idxof==-1) {
				menuNameArr.push(result_open_history[i]['history'][j]['menu_name']);
				menuIdxArr.push(result_open_history[i]['history'][j]['menu_idx']);
				menuCntArr.push(1);
			}
			else {
				menuCntArr[idxof]++;
			}
		}
		//push: 1인당 평균 매출 
		result_open_history[i]['salesPerPerson'] = result_open_history[i]['todays_sum']/people.length;
		//push: 연령별
		result_open_history[i]['historyAge'] = age;
		//push: 성별
		result_open_history[i]['historyGender'] = [cntMale, cntFemale];
		
		//sort: 메뉴
		menuNameArr.sort(
			function (a,b) {
				var idxA = menuNameArr.indexOf(a);
				var idxB = menuNameArr.indexOf(b);
				return menuCntArr[idxB]-menuCntArr[idxA];
			}
		);
		menuIdxArr.sort(
			function (a,b) {
				var idxA = menuIdxArr.indexOf(a);
				var idxB = menuIdxArr.indexOf(b);
				return menuCntArr[idxB]-menuCntArr[idxA];
			}
		);
		menuCntArr.sort(
			function (a,b) {
				return b-a;
			}
		);
		//push: 메뉴
		result_open_history[i]['historyMenuName'] = menuNameArr;
		result_open_history[i]['historyMenuIdx'] = menuIdxArr;
		result_open_history[i]['historyMenuCount'] = menuCntArr;
	}

	// 상세 판매 정보는 넘기지 않는다.
	for(var i=0 ; i<result_open_history.length ; i++) {
		delete result_open_history[i].history;
	}

	UTCtoLocal(result_open_history, 'start');
	UTCtoLocal(result_open_history, 'end');
	jsonStr = '{"code":700,"result":'+JSON.stringify(result_open_history)+'}';
	res.end(jsonStr);
	return;
}

function UTCtoLocal (str, fieldName) {
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