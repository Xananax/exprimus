var http = require('http');

function getFromObjectAndDelete(obj,param,def){
	if(obj && obj[param]){
		def = obj[param];
		delete obj[param];
	}
	return def;
}

function SparkRequest(spark,data){
	var method = getFromObjectAndDelete(data,'method','get').toUpperCase()
	,	url = getFromObjectAndDelete(data,'url','/')
	,	req = {
			__proto__:http.IncomingMessage.prototype
		,	url:url
		,	method:method
		,	data:data
		,	params:{}
		,	param:sparkRequestParam
		,	headers:spark.headers
		,	isSocket:true
		}
	;
	return req;
}

function sparkRequestParam(key){
	return this.params && this.params[key];
}

module.exports = SparkRequest;