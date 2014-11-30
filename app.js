/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var routesJoin = require('./routes/join');
var routesTruck = require('./routes/truck');
var routesUpload = require('./routes/upload');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

app.get('/', routes.index);

// 메인 페이지에서 나의 정보가져오기
//app.get('/getMyProfile', routesMain.getMyProfile);
//app.get('/logout', routesMain.logoutRequest);


app.get('/join', routesJoin.join);
app.get('/phoneOverlapCheck', routesJoin.phoneOverlapCheck);
// TODO: post 로 변경
app.get('/getTruckList', routesTruck.getTruckList);
app.get('/getTruckInfo', routesTruck.getTruckInfo);
app.post('/upload', routesUpload.upload);


var server = http.createServer(app).listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
});

//Http Error Handler
server.on('error',function(err){
	console.log('에러가 나타낫다 ');
});

// socket io위해
var io = require('socket.io').listen(server);

// log level 수정
io.set('log level', 2);

///////////////////////////////////////////////////////////
//////////// 이 아래 안쓰일듯.. 왜냐면 복붙이기 때문이지! /////////////
///////////// 2014.11.29 //////////////////////////////////
///////////////////////////////////////////////////////////

var CAT_K = 1000;
var emailCheck = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
var users = {};
// { email : { profile : {data} , socket_id : 'socket.id', talkWith : 'email'  }} 의 형식
var SocketToEmail = {};

var catDif = function(cat1, cat2){
	// 아니 왜 cat1이랑 cat2에 undefined가 들어와 이 나쁜 놈들아
	if(typeof(cat1)!== "string" || typeof(cat2)!=="string") return 0;
	// cat1이 기준 고민 (자신의 고민), cat2가 다른 사람의 고민
	var par1 = cat1.split("::"), par2 = cat2.split("::"), res=0;
	if(par1[0] === par2[0]){
		res += 50;
		// 대주제가 다르다면 0을 반환하고, 같다면 res에 50을 더한다.
		var spar1 = par1[1].split("/"), spar2 = par2[1].split("/"), tmp=0;
		var check = {};
		for(var i in spar1){
			if(spar1[i] === "") break;
			check[spar1[i]] = true;
		}
		for(var i in spar2){
			if(typeof(check[spar2[i]]) === 'undefined') continue;
			tmp++;
		}
		// res에 10 * (일치하는 소주제 개수 / 자신의 소주제 개수)를 더한다.
		// 죽 res의 최댓값은 10 + 10으로 20이 된다.
		res += 10 * tmp / (spar1.length-1);
	}
	return res;
}

io.sockets.on('connection', function(socket) {
	console.log('connection');
	// 접속했을 경우 브로드케스트로 클라이언트 갱신
	// 프로필을 각 소켓마다 저장
	socket.on('set profile', function(data) {
		//중복 접속자 제거
		if(typeof(data) !== 'object'){
			var reqData = {};
			reqData.errorMessage = "set profile : Data가 잘못 전송되었습니다.";
			reqData.whatError = "logout";
			socket.emit('error occured', reqData);
			//socket.emit('logout'); // 일단 강제로 로그아웃 시킴...
		}
		else if(typeof(data.email) !== 'string'){
			var reqData = {};
			reqData.errorMessage = "set profile : Data의 email의 형식이 string이 아닙니다.";
			reqData.whatError = "logout";
			socket.emit('error occured', reqData);
			//socket.emit('logout');
		}
		else if(data.email !== 'a' && data.email !== 'b' && data.email !== 'c' && data.email !== 'd' && emailCheck.test(data.email) === false){
			var reqData = {};
			reqData.errorMessage = "set profile : Data의 email이 정상적이지 않은 이메일입니다. 비정상적 접근";
			reqData.whatError = "logout";
			socket.emit('error occured', reqData);
			//socket.emit('logout');
		}
		else{
			var tCheck = false;
			if(users[data.email] != null){
				if(users[data.email].socket_id === socket.id) tCheck = true;
				io.sockets.sockets[users[data.email].socket_id].emit('logout');
				delete users[data.email];
			}
			if(tCheck === false){
				// 매칭을 빠르게하기위해 socket 아이디별 email을 매칭 시켜놓는다.
				SocketToEmail[socket.id] = data.email;
				var tmp = {};
				tmp.profile = data;
				tmp.socket_id = socket.id;
				tmp.talkWith = '';
		
				users[data.email] = tmp;
				
				console.log("현재 " + Object.keys(users).length + "명");
				console.log("longitude " + tmp.profile.longitude);
				console.log("latitude " + tmp.profile.latitude);
				console.log(users);
				socket.emit('user connected');
				//socket.broadcast.emit('user connected');
			}
		}
	});
	

	// 접속자 정보 요청
	socket.on('get users', function() {
		var useremail = SocketToEmail[socket.id];
		var distarr = [], size = users.length;
		var tlat;
		var tlon;
		var tcat;
		
		if(!users.hasOwnProperty(useremail)){
			var reqData = {};
			reqData.errorMessage = "현재 접속되어있지 않은 계정입니다. 잘못된 접근입니다.";
			reqData.whatError = "disconnect";
			socket.emit('error occured', reqData);
			//socket.emit('disconnect');
			return;
		}
		
		tlat = users[useremail].profile.latitude;
		tlon = users[useremail].profile.longitude;
		tcat = users[useremail].profile.category;
		
		console.log("GET USERS");
		console.log("email " + useremail);
		console.log("tlat " + tlat);
		console.log("tlon " + tlon);
		console.log("현재 사람 수  : " + Object.keys(users).length);
		
		for(var i in users){
			if(i === useremail) continue; // 자기 자신이면 제외
			if(users[i].talkWith !== '') continue; // 이미 대화하고 있는 사람이면 제외 
			if(i !== 'a' && i !== 'b' && i !== 'c' && i !== 'd'
				&& emailCheck.test(i) === false) continue; // 정상적이지 않은 email이 들어가있는 경우 제외
			if(typeof(i) !== 'string') continue; // undefined가 나오는 극소수의 경우 (...) 제외
			
			// 현식아 여기 수정했어 ㅋ *********************************************************************************************************
			var temp = {};
			temp.email = i;
			temp.dist = llDist(tlat, tlon, users[i].profile.latitude, users[i].profile.longitude);
			console.log("between " + useremail + " and " + i + " dist is " + temp.dist);
			temp.category = catDif(tcat,users[i].profile.category);
			distarr.push(temp);
			//console.log("temp : ");
			//console.log(temp);
		}
		// 10km 떨어졌는데 비슷한 고민이 있는 사람, 1km 떨어졌는데 많이 다른 고민이 있는 사람. 어떻게 쿼리해줘야할까?
		// CAT_K의 값은 1000으로 설정되어있음. 위에서 찾아볼 것
		//console.log(distarr);
		distarr.sort(function(p,q){
			return p.dist - q.dist + CAT_K * (p.category - q.category);
		});
		//console.log(distarr);
		var ret = {};
		var nowemail = '';
		// ret은 { email : { profile : {data} , socket_id : 'socket.id', talkWith : 'email', dist : 'distance', rank : 'rank' }} 의 형식
		for(var i=0;i<distarr.length && i<5;i++){
			nowemail = distarr[i].email;
			console.log("ret [" + i + "] : " + nowemail);
			var rettmp = {};
			rettmp.profile = users[nowemail].profile;
			rettmp.socket_id = users[nowemail].socket_id;
			rettmp.talkWith = users[nowemail].talkWith;
			rettmp.dist = distarr[i].dist;
			rettmp.rank = i;
			console.log("rettmp : ");
			console.log(rettmp);
			ret[nowemail] = rettmp;
		}
		console.log("RET");
		console.log(ret);
		socket.emit('users profile', ret);
	});
	
	// 대화 요청 (profile, user)
	socket.on('talk request', function(data) {
		// 새로고침한 후에 상대방이 나갔을 경우...
		console.log('talk request : ');
		console.log(data);
		if(typeof(data.user) === 'undefined'){
			var reqData ={};
			reqData.errorMessage = "잘못된 접근입니다. 자동으로 리스트를 새로고침합니다.";
			reqData.whatError = "getlist";
			socket.emit('error occured', reqData);
		}
		else if(!users.hasOwnProperty(data.user)){
			var reqData ={};
			reqData.errorMessage = "상대방이 현재 접속되어있지 않습니다. 자동으로 리스트를 새로고침합니다.";
			reqData.whatError = "getlist";
			socket.emit('error occured', reqData);
			/*
			var reqMessage = {};
			reqMessage.reply = 'out';
			// 그냥 거절 당했다고 오게 함. 나중에 이벤트 따로 넣던 해야함.
			socket.emit('talk request reply', reqMessage);*/
		}
		else if(users[data.user].talkWith !== ''){
			var reqData ={};
			reqData.errorMessage = "상대방이 현재 대화 중입니다. 자동으로 리스트를 새로고침합니다.";
			reqData.whatError = "getlist";
			socket.emit('error occured', reqData);	
		}
		else{
			var socket_id = users[data.user].socket_id;
			var reqMessage = {};
			reqMessage.profile = data.profile;
			io.sockets.sockets[socket_id].emit('talk request', reqMessage);
		}
	});
	
	// 대화 요청 응답 (profile, reply)
	socket.on('talk request reply', function(data) {
		// 소켓을 찾기 위해 닉네임을 그대로 포워딩받음
		console.log('talk request reply : ');
		console.log(data);
		if(typeof(data.profile) === 'undefined'){
			var reqData ={};
			reqData.errorMessage = "잘못된 접근입니다. 자동으로 리스트를 새로고침합니다.";
			reqData.whatError = "getlist";
			socket.emit('error occured', reqData);
			return;
		}
		else if(!users.hasOwnProperty(data.profile.email)){
			var reqData ={};
			reqData.errorMessage = "상대방이 현재 접속되어있지 않습니다. 자동으로 리스트를 새로고침합니다.";
			reqData.whatError = "getlist";
			socket.emit('error occured', reqData);
			return;
			/*
			var reqMessage = {};
			reqMessage.reply = 'out';
			// 그냥 거절 당했다고 오게 함. 나중에 이벤트 따로 넣던 해야함.
			socket.emit('talk request reply', reqMessage);*/
		}
		else if(users[data.profile.email].talkWith !== ''){
			var reqData ={};
			reqData.errorMessage = "상대방이 현재 대화 중입니다. 자동으로 리스트를 새로고침합니다.";
			reqData.whatError = "getlist";
			socket.emit('error occured', reqData);
			return;
		}
		else if(users[SocketToEmail[socket.id]].talkWith !== ''){
			var reqData = {};
			reqData.errorMessage = "예상치 못한 에러입니다.(자기자신이 이미 채팅) 자동으로 리스트를 새로고침합니다.";
			reqData.whatError = "getlist";
			socket.emit('error occured', reqData);
			return;
		}
		var socket_id = users[data.profile.email].socket_id;
		var reqMessage = {};
		if (data.reply == 'yes') {
			reqMessage.reply = 'yes';
			reqMessage.nick = data.userNick; 
			//서로의 user 데이터에 대화하는 사람의 Email 정보를 넣어줌
			users[SocketToEmail[socket.id]].talkWith = users[data.profile.email].socket_id;
			users[data.profile.email].talkWith = socket.id;
			
		} else if (data.reply == 'no') {
			// data.nickname 님이 거절했습니다.
			reqMessage.reply = 'no';
		} else {
			console.log('대화 요청 응답 잘못된 패킷 들어옴');
			reqMessage.reply = 'out';
		}
		io.sockets.sockets[socket_id].emit('talk request reply',reqMessage);
	});
	
	// ****************************************** 대화 공개 부분 *******************************************************
	socket.on('list request', function(){
		console.log('list request');
		var email = SocketToEmail[socket.id];
		if(!users.hasOwnProperty(SocketToEmail[users[email].talkWith]))
		{
			var reqData = {};
			reqData.errorMessage = "예상치 못한 에러입니다.(상대방이 채팅에서 나가짐) 자동으로 리스트를 새로고침합니다.";
			reqData.whatError = "disconnect";
			socket.emit('error occured', reqData);
			return;
		}
		io.sockets.sockets[users[email].talkWith].emit('list request');
	});
	socket.on('list request reply', function(data){
		console.log('list request reply');
		var email = SocketToEmail[socket.id];
		if(!users.hasOwnProperty(SocketToEmail[users[email].talkWith]))
		{
			var reqData = {};
			reqData.errorMessage = "예상치 못한 에러입니다.(상대방이 채팅에서 나가짐) 자동으로 리스트를 새로고침합니다.";
			reqData.whatError = "disconnect";
			socket.emit('error occured', reqData);
			return;
		}
		io.sockets.sockets[users[email].talkWith].emit('list request reply', data);
	});
	socket.on('list insert', function(data){
		console.log('list insert');
		console.log(data);
		var temp = '';
		temp = data.category;
		temp = temp.split("::");
		data.category = temp[0];
		console.log(data);
		var sucOrFail = routesProblemDictionary.insertProblemDictionary(data);
		var reqData = {};
		console.log("sucOrFail is " + sucOrFail);
		if(sucOrFail == 'yes') reqData.reply = 'yes';
		else reqData.reply = 'no';
		socket.emit('list insert reply', reqData);
		
		var email = SocketToEmail[socket.id];
		if(!users.hasOwnProperty(SocketToEmail[users[email].talkWith]))
		{
			var reqData = {};
			reqData.errorMessage = "예상치 못한 에러입니다.(상대방이 채팅에서 나가짐) 자동으로 리스트를 새로고침합니다.";
			reqData.whatError = "disconnect";
			socket.emit('error occured', reqData);
			return;
		}
		io.sockets.sockets[users[email].talkWith].emit('list insert reply', reqData);
	});
	// ****************************************** 대화 공개 부분 *******************************************************
	
	//메세지 전송
	socket.on('send message',function(data){
		console.log('send message : ');
		console.log(data);
		var email = SocketToEmail[socket.id];
		var reqMessage = {};
		if(!users.hasOwnProperty(email))
		{
			var reqData = {};
			reqData.errorMessage = "예상치 못한 에러입니다.(상대방이 채팅에서 나가짐) 자동으로 리스트를 새로고침합니다.";
			reqData.whatError = "disconnect";
			socket.emit('error occured', reqData);
			return;
		}
		reqMessage.nickname = users[email].profile.nickname;
		reqMessage.message = data.message;
		
		if(users[data.email].talkWith === ''){
			var reqData = {};
			reqData.errorMessage = "예상치 못한 에러입니다.(상대방이 채팅에서 나가짐) 자동으로 리스트를 새로고침합니다.";
			reqData.whatError = "disconnect";
			socket.emit('error occured', reqData);
			return;
		}
		else if(users[email].talkWith === ''){
			var reqData = {};
			reqData.errorMessage = "예상치 못한 에러입니다.(자기자신이 서버상에서 채팅에서 나가짐) 자동으로 리스트를 새로고침합니다.";
			reqData.whatError = "disconnect";
			socket.emit('error occured', reqData);
			return;
		}

		socket.emit('get message',reqMessage);
		io.sockets.sockets[users[data.email].talkWith].emit('get message',reqMessage);
	});
	
	//나가기 요청
	socket.on('exit request', function(){
		var email = SocketToEmail[socket.id];
		if(users.hasOwnProperty(SocketToEmail[users[email].talkWith])){
			users[SocketToEmail[users[email].talkWith]].talkWith = '';
			io.sockets.sockets[users[email].talkWith].emit('user disconnected');
		}
		users[email].talkWith = '';
	});
	
	//접속자 한명 나감
	socket.on('disconnect', function() {
		console.log('disconnect');
		socket.emit('disconnect');
		
		var email = SocketToEmail[socket.id];
		if(users.hasOwnProperty(email)){
			if(users[email].talkWith != ''){
				io.sockets.sockets[users[email].talkWith].emit('user disconnected');
			}
		}
		delete users[email];
		delete SocketToEmail[socket.id];
	});
	
	socket.on('logout',function(data){
		console.log('logout reqest');
		if(users.hasOwnProperty(data)){
			if(users[data].talkWith != ''){
				try{
					io.sockets.sockets[users[data].talkWith].emit('user disconnected');
				}
				catch(e){
				}
			}
		}
		delete users[data];
		delete SocketToEmail[socket.id];
	});
});
