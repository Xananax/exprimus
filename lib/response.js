var http = require('http');

function SparkResponse(spark,methods){

	var res = {
		__proto__: http.ServerResponse.prototype
	,	locals:{}
	};
	res.send = methods.send().bind(res,spark);
	res.render = methods.render().bind(res,spark);
	return res;
}

module.exports = SparkResponse;