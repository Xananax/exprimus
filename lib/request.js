function getFromObjectAndDelete(obj,param,def){
	if(obj[param]){
		def = obj[param];
		delete obj[param];
	}
	return def;
}

function SparkRequest(spark,data){
	var method = getFromObjectAndDelete(data,'method','get').toUpperCase()
	,	url = getFromObjectAndDelete(data,'url','/')
	,	req = {
			url:url
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

function sparkRequestParam(data,key){
	return data[key];
}

module.exports = SparkRequest;