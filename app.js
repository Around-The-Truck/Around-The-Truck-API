/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var routesJoin = require('./routes/join');
var routesTruck = require('./routes/truck');
var routesUpload = require('./routes/upload');
var routesArticle = require('./routes/article');
var routesHistory = require('./routes/history');
var routesPayment = require('./routes/payment');
var http = require('http');
var path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('KSH dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.bodyParser());
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


// 손님 회원가입
app.get('/join', routesJoin.join);
app.get('/phoneOverlapCheck', routesJoin.phoneOverlapCheck);
// 트럭 리스트 불러오기
app.get('/getTruckList', routesTruck.getTruckList);
// 한개 트럭 정보 불러오기
app.get('/getTruckInfo', routesTruck.getTruckInfo);
// 간단한 트럭 정보를 리턴.
app.post('/getTruckShort', routesTruck.getTruckShort);
// 장사 시작
app.post('/truckStart', routesTruck.truckStart);
// 장사 끝
app.post('/truckEnd', routesTruck.truckEnd);
// 파일 업로드 (테스트)
app.post('/upload', routesUpload.upload);
// 유효한 고유번호인지 확인
app.get('/truckNumCheck', routesJoin.truckNumCheck);
// 트럭 회원가입
app.post('/truckJoin', routesJoin.truckJoin);
// 한 개의 article 을 받아온다. (by idx)
app.post('/getArticle', routesArticle.getArticle);
// article 들을 받아온다. (by writer)
app.post('/getArticleList', routesArticle.getArticleList);
// 특정 사용자의 follow list 를 받아온다.
app.get('/getFollowList', routesHistory.getFollowList);
// 게시글에 좋아요를 누른다 (사용자만 가능)
app.get('/likeArticle', routesArticle.likeArticle);
// 게시글에 댓글을 단다 (트럭, 사용자 둘 다 가능)
app.post('/addReply', routesArticle.addReply);
// 게시글의 댓글을 가져온다.
app.post('/getReplyList', routesArticle.getReplyList);
// 트럭을 팔로우 한다.(사용자만 가능)
app.get('/followTruck', routesTruck.followTruck);
// 트럭을 언팔로우 한다.(사용자만 가능)
app.get('/unfollowTruck', routesTruck.unfollowTruck);
// 게시글 좋아요를 취소한다. (사용자만 가능)
app.get('/unlikeArticle', routesArticle.unlikeArticle);
// TODO : 정산하기
app.get('/calculate', routesPayment.calculate);
// TODO : 메뉴 불러오기
//app.
// TODO : 결제 실행
app.get('/pay', routesPayment.pay);

// TODO : 게시글 작성 (트럭만 가능)
// TODO : 메뉴 등록
app.post('/addMenuList', routesTruck.addMenuList);
// TODO : 손님 회원가입 다시짜기 (번호인증 포함)
// 메뉴 불러오기
app.post('/getMenuList', routesTruck.getMenuList);


var server = http.createServer(app).listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
});

//Http Error Handler
server.on('error',function(err){
	console.log('에러가 나타낫다 ');
});