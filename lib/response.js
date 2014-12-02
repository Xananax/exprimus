var http = require('http')
,	extend = require('node.extend')
;

function sparkSend(data){
	if(typeof data == 'string'){data = {response:data};}
	else if(data instanceof Error){data = {
		error:{
			message: data.message
		,	name: data.name
		}
	};}
	this.spark.write(data);
}


function makeSparkRender(properties){
	var path = properties['views']
	var engineName = properties['view engine'];
	if(!path){throw new Error('no views path set for render');}
	if(!engineName){throw new Error('no engine set for render');}
	engine = require(engineName);
	renderFunction = engine.__express;
	return function sparkRender(view,data){
		view = view || data.view || 'index';
		path+='/'+view+'.'+engineName;
		var locals = extend(true,{skipLayout:true},this.locals,data)
		var rendered = renderFunction(path,locals);
		locals.render = rendered;
		this.spark.write(locals);
	}
}

function SparkResponse(properties){

	var sparkRender = makeSparkRender(properties);

	return function SparkResponseFactory(spark){
		var res = {
			__proto__: http.ServerResponse.prototype
		,	locals:{}
		,	spark:spark
		,	send:sparkSend
		,	render:sparkRender
		};
		return res;
	}
}

module.exports = SparkResponse;