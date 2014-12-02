/*** REQUIRED MODULES ***/
var	express = require('express')
,	Exprimus = require('exprimus')
,	path = require('path');
;
/*** APP ***/
var	app = express()
,	pApp = Exprimus(app)
;

/*** VIEWS ***/
pApp.set('views', path.join(__dirname,'views'));
pApp.set('view engine', 'jade');

/*** SERVER SETTINGS ***/
pApp.set('transformer','engine.io');
pApp.set('port', process.env.PORT || 3000);

/*** SESSION AND COOKIES ***/
// you can skip this if you don't need sessions
pApp.set('secret','shhh, very secret');
// Persisting store, see https://github.com/expressjs/session
pApp.set('store',new pApp.session.MemoryStore());
pApp.session();

/*** STATIC ROUTING ***/
// I couldn't make streams work with primus yet, so for
// the time being, set express.static on the express app
// only
app.use(express.static(path.join(__dirname, 'public')));

/*** ROUTING ***/
pApp.get('/',function(req,res){
	res.render('index',{title:'home',url:'/'});
});
pApp.get('/:id',function(req,res,next){
	var id = req.param('id');
	res.render('index',{title:id,url:'/'});
});
pApp.get('/data/:id',function(req,res,next){
	var id = req.param('id');
	if(req.isSocket){ // this is a primus request
		res.send({url:'/',title:id});
	}
	else{ // this is a normal request
		res.render('data',{title:id,url:'/'});
	}
})

/*** ERROR HANDLING ***/
pApp.use(function(req, res, next) {
	var err = new Error('Not Found: '+req.url);
	err.status = 404;
	next(err);
});

/*** START THE SERVER ***/
var server = pApp.listen(pApp.get('port'),function(){ 
	console.log('Exprimus server listening on port ' + server.address().port);
},function(spark){ //this runs on every connection
	spark.on('data',function(data){
		console.log('received',data);
	})
});
/***/