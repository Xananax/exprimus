var Primus = require('primus')
,	SparkRequest = require('./request')
,	SparkResponse = require('./response')
,	Route = require('./route')
,	extend = require('node.extend')
,	primusSession = require('./session')
,	cookieParser = require('cookie-parser')
,	expressSession = require('express-session')
;

var verbs = ['all','get','post','put','delete'];

function PrimusRouter(app){

	var methods = {
		app:app
	,	_meta:{}
	};
	var properties = {
		'views':''
	,	'view engine':'jade'
	,	'transformer':'websocket'
	}
	var routes = [];
	var verb,i=0;
	while(verb = verbs[i++]){
		methods[verb] = onVerb(verb,routes).bind(methods);
	}

	methods.use = onVerb('use',routes).bind(methods);
	methods.set = setProperty.bind(methods,properties);
	methods.getProp = getProperty.bind(methods,properties);
	methods.listen = listen.bind(methods,methods,routes,properties);
	methods.render = render.bind(methods,properties);
	methods.send = send.bind(methods);
	methods.routes = routes;
	methods.connect = connect.bind(methods,methods,routes,properties);
	methods.cookie = cookie.bind(methods,methods,properties);
	methods.session = session.bind(methods,methods,properties);
	methods.session.MemoryStore = expressSession.MemoryStore;
	return methods;

};

function cookie(methods,properties,secret){
	secret = secret || properties.secret;
	var app = methods.app;
	if(!secret){throw new Error('no secret set for cookies');}
	if(!app){throw new Error('you must create an app before setting cookies');}

	var cookiesMiddleware = cookieParser(secret);
	app.use(cookiesMiddleware);
	methods._meta.cookie = cookiesMiddleware;
}

function session(methods,properties,secret,store){
	secret = secret || properties.secret;
	store = store || properties.store;
	var app = methods.app;
	if(!store){throw new Error('no store set for session');}
	if(!secret){throw new Error('no secret set for session');}
	if(!app){throw new Error('you must create an app before setting session');}
	if(!methods._meta.cookie){
		cookie(methods,properties,secret);
	}
	var sessionMiddleWare = expressSession({
		saveUninitialized: true
	,	secret: secret
	,	resave: true
	,	store: store
	});
	app.use(sessionMiddleWare);
	methods._meta.session = store;
}

function send(){
	return function sparkSend(spark,data){
		if(typeof data == 'string'){data = {response:data};}
		else if(data instanceof Error){data = {
			error:{
				message: data.message
			,	name: data.name
			}
		};}
		spark.write(data);
	}
}

function render(properties){
	var path = properties['views']
	var engineName = properties['view engine'];
	if(!path){throw new Error('no views path set for render');}
	if(!engineName){throw new Error('no engine set for render');}
	engine = require(engineName);
	renderFunction = engine.__express;
	return function sparkRender(spark,view,data){
		view = view || data.view || 'index';
		path+='/'+view+'.'+engineName;
		var locals = extend(true,{skipLayout:true},this.locals,data)
		var d = {
			render:renderFunction(path,locals)
		}
		spark.write(d)
	}
}

function listen(methods,routes,properties,port,fn){
	if((typeof port == 'number' || typeof port == 'string')){
		if(!this.app){
			throw new Error("you must create an express app and pass it to primusRouter before calling listen");
		}
		var server = this.app.listen(this.app.get('port'),function(){
			fn();
		});
		this.connect(server);
		return server;
	}
	return this.connect(port,fn);
}

function connect(methods,routes,properties,server,fn){
	var primus = new Primus(server,properties);
	var onPrimusConnection = onPrimusConnectionMaker(methods,routes);
	methods.library = primus.library.bind(primus);
	methods.save = primus.save.bind(primus);
	if(methods._meta.cookie){
		primus.before('cookies', methods._meta.cookie);
	}
	if(methods._meta.session){
		primus.before('session', primusSession, { store: methods._meta.session });
	}
	primus.on('connection',function connection(spark){
		spark.on('data',onPrimusConnection(spark));
		if(fn){fn(spark);}
	});
	return this;
}

function setProperty(properties,prop,val){
	properties[prop] = val;
	if(this.app){this.app.set(prop,val);}
	return this;
}

function getProperty(properties,prop){
	return properties[prop];
	return this;
}

function onVerb(method,routes){
	return function(/**path,functions**/){
		var args = new Array(arguments.length), i = 0, path = '',arg;
		while(arg = arguments[i]){args[i++] = arg;};
		if(this.app){
			this.app[method].apply(this.app,args);
		}
		if(typeof args[0] !== 'function'){path = args.shift();}
		var route = Route(path,method,args);
		routes.push(route)
		return this;
	}
}

function onPrimusConnectionMaker(methods,routes){
	var l = routes.length;
	return function onPrimusConnection(spark){
		return function onSparkData(data){
			if(typeof data == 'string'){data = {url:data};}
			if(!data.url){return;}
			var i = 0
			,	fn
			,	route
			,	errors = []
			,	req = SparkRequest(spark,data)
			,	res = SparkResponse(spark,methods)
			,	params
			;
			(function next(err){
				if(err){errors = errors.concat(err);}
				if(i>=l){
					if(errors.length){
						res.send(errors[0]);
						return;
					}
					var err = new Error('could not '+req.method+' '+req.url);
					err.status = 404;
					res.send(err);
					return;
				}
				route = routes[i++];
				if(errors.length && route.handleErrors && (params = route.match(req.url,req.method))){
					req.params = params;
					req.param = req.param.bind(req,params);
					route.process(errors,req,res,next);
					return;
				}
				//console.log(route.path,route.method,req.url)
				if(params = route.match(req.url,req.method)){
					req.params = params;
					req.param = req.param.bind(req,params);
					route.process(req,res,next);
					return;
				}
				next();
			})();
		}
	}
}

module.exports = PrimusRouter;