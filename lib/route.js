var pathToRegexp = require('path-to-regexp');

function match(keys,originalMethod,path,givenMethod){
	var match;
	var validMethod = false;
	var validMatch = false;
	if(originalMethod == 'use'){validMethod = true;}
	else if(originalMethod == 'all'){validMethod = true;}
	else if(givenMethod == 'all'){validMethod = true;}
	else if(originalMethod == givenMethod){validMethod = true;}
	if(!validMethod){return false;}
	if(!this.path){return {};}

	match = this.regexp.exec(path);
	validMatch = !!match;
	if(!validMatch){return false;}
	var	params = {}
	,	n = 0
	,	i = 0
	,	prop
	,	key
	,	val
	;

	for(; i < match.length; i++) {
		key = keys[i];
		val = decode_param(match[i]);
		prop = key ? key.name : n++;
		params[prop] = val.replace(/^\//,'');
	}

	return params;
};

function decode_param(val){
	if (typeof val !== 'string') {
		return val;
	}

	try {
		return decodeURIComponent(val);
	} catch (e) {
		var err = new TypeError("Failed to decode param '" + val + "'");
		err.status = 400;
		throw err;
	}
}

function Route(path,method,functions){
	var route = {}
	,	keys = []
	,	arity
	,	fn
	,	i = 0
	,	l = functions.length
	;
	method = method.toUpperCase();
	route.method = method;
	route.regexp = pathToRegexp(path,keys);
	route.path = path;
	route.keys = keys;
	route.match = match.bind(route,route.keys,method);
	route.handleErrors = false;
	while(i<l && !route.handleErrors){
		if(functions[i++].length>3){route.handleErrors = true;}
	}
	route.process = function(errors,req,res,cb){
		var i = 0;
		if(arguments.length<4){
			cb = res;
			res = req;
			req = errors;
			errors = null;
		}
		errors = errors || [];
		(function next(err){
			if(err){errors.push(err);}
			if(i>=l){return errors.length ? cb(errors):cb();}
			fn = functions[i++];
			var length = fn.length;
			if(errors.length && length>3){
				req.errors = errors;
				fn(errors[0],req,res,next);
				return;
			}
			if(length<=3){
				fn(req,res,next);
				return;
			}
			next();
		})();
	}
	return route;
}

module.exports = Route;