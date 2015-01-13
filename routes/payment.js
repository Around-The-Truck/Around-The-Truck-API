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

	client.query('select idx, group_idx, menu_idx, (select name from menu where idx=buy_history.menu_idx) as menu_name, price as paid, customer_phone, (select age from customer where phone=buy_history.customer_phone) as customer_age, (select gender from customer where phone=buy_history.customer_phone) as customer_gender, cash_card_point, reg_date from buy_history where truck_idx=?',
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
	// 정산할 사항들을 계산합니다
	for(var i=0 ; i<result_open_history.length ; i++) {
		var people = Array();
		var age = Array(0,0,0,0,0,0,0,0,0,0);
		var cntMale = 0;
		var cntFemale = 0;
		var cntCard = 0;
		var cntCash = 0;
		var cntPoint = 0;
		var paidSum = 0;
		var pointUse = 0;

		var menuIdxArr = Array();
		var menuCntArr = Array();
		var menuNameArr = Array();

		// 시간대별 그래프 관련
		var graphLength = 5;
		var timeStart = result_open_history[i]['start'];
		var timeEnd = result_open_history[i]['end'];
		var timeDiff = Math.abs((timeEnd.getTime() - timeStart.getTime()) / graphLength);
		var timeSeperator = Array(graphLength);
		var timeCnt = Array(graphLength);
		for(var m=0 ; m<graphLength ; m++)	timeCnt[m] = 0;

		//console.log("start: "+timeStart);
		for(var k=0 ; k<graphLength ; k++) {
			timeSeperator[k] = new Date(result_open_history[i]['start'].getTime() + (timeDiff * k));
			//console.log("  timeSep["+k+"]: "+timeSeperator[k]);
		}
		//console.log("end  : "+timeEnd);

		for(var j=0 ; j<result_open_history[i]['history'].length ; j++) {
			// 시간대별 집계
			for(var l=0 ; l<graphLength ; l++) {
				if(result_open_history[i]['history'][j]['reg_date']>=timeSeperator[l] && result_open_history[i]['history'][j]['reg_date']<timeSeperator[l+1]) {
					timeCnt[l] = (timeCnt[l]==undefined)? 1 : timeCnt[l]+1;
					break;
				}
			}
			// 성별
			(result_open_history[i]['history'][j]['customer_gender']==1)? cntMale++ : cntFemale++;

			// 연령대
			age[parseInt(result_open_history[i]['history'][j]['customer_age']/10,10)]++;

			// 손님 수 계산
			if(people.indexOf(result_open_history[i]['history'][j]['customer_phone'])==-1) {
				people.push(result_open_history[i]['history'][j]['customer_phone']);
			}

			// 총 매출 계산
			paidSum += parseInt(result_open_history[i]['history'][j]['paid']);

			// 카드, 현금, 포인트 계산 (포인트 집계도 같이 이루어진다.... else 에서)
			var ccp = parseInt(result_open_history[i]['history'][j]['cash_card_point']);
			if(ccp==0)	cntCash++;
			else if(ccp==1)	cntCard++;
			else {
				cntPoint++;
				pointUse += parseInt(result_open_history[i]['history'][j]['price']);
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
		result_open_history[i]['salesPerPerson'] = (paidSum==0)? 0 : paidSum/people.length;
		//push: 연령별
		result_open_history[i]['historyAge'] = age;
		//push: 성별
		result_open_history[i]['historyGender'] = [cntMale, cntFemale];
		//push: 총매출
		result_open_history[i]['todays_sum'] = paidSum;
		//push: 카드 or 현금 or 포인트
		result_open_history[i]['historyCardCashPoint'] = [cntCard, cntCash, cntPoint];
		//push: 포인트 획득, 사용 (획득은 추후에 계산됨)
		result_open_history[i]['pointGetUse'] = [0, pointUse];
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
		//push: 시간대별 그래프 관련
		result_open_history[i]['timeSeperator'] = timeSeperator;
		result_open_history[i]['timeSeperator'] = UTCtoLocalSep (result_open_history[i]['timeSeperator']);
		result_open_history[i]['timeCnt'] = timeCnt;
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

function UTCtoLocalSep (str) {
	for(var i=0 ; i<str.length ; i++) {
		var res = "";
		var d = new Date(str[i]);

		res += d.getFullYear()+"-";
		res += (((d.getMonth()+1)<10)?"0"+(d.getMonth()+1):(d.getMonth()+1))+"-";
		res += (((d.getDate())<10)?"0"+(d.getDate()):(d.getDate()))+" ";
		res += (((d.getHours())<10)?"0"+(d.getHours()):(d.getHours()))+":";
		res += (((d.getMinutes())<10)?"0"+(d.getMinutes()):(d.getMinutes()))+":";
		res += (((d.getSeconds())<10)?"0"+(d.getSeconds()):(d.getSeconds()))+"";	

		str[i] = res;
	}
	return str;
}