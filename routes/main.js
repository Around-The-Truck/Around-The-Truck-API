/**
 * New node file
 */

exports.getMyProfile = function(req, res) {
	res.writeHead(200, {
		'Content-Type' : 'application/json;charset=utf-8'
	});
	try {
		var callback = req.query.callback;
		// 프로필 JSON DATA 생성
		var profile = {};

		if (req.session.authenticated) {
			profile.email = req.session.email;
			profile.nickname = req.session.nick;
			profile.age = req.session.age;
			profile.category = req.session.category;
			profile.character = req.session.character;
			profile.comment = req.session.comment;
			profile.check = true;
		}else{
			profile.check = false;
		}

		// jsonp 방식
		res.end(callback + "(" + JSON.stringify(profile) + ")");
	} catch (error) {
		console.log("route main error : " + error);
	}
};

exports.logoutRequest = function(req, res) {
	res.writeHead(200, {
		'Content-Type' : 'application/json;charset=utf-8'
	});
	try {
		var callback = req.query.callback;
		// 프로필 JSON DATA 생성

		var resultMessage = {};

		if (req.session.authenticated) {
			req.session.destroy;
			resultMessage.result = 1;
		} else {
			resultMessage.result = 0;
		}

		// jsonp 방식
		res.end(callback + "(" + JSON.stringify(resultMessage) + ")");
	} catch (error) {
		console.log("route main error : " + error);
	}
};