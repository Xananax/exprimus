# EXPRIMUS

re-use your express routes with your websocket server.  
define them once, use them everywhere.

## Install
```
npm install --save exprimus express engine.io cookie-parser express-session
```

In details:

first, install exprimus
```
npm install --save exprimus
```

install express
```
npm install express
```
note that express is not mandatory; you could use exprimus as a pure socket router, without express.

Then, get a real-time framework, for example, engine.io
```
npm install --save engine.io
```
(for more info, head to [Primus](https://github.com/primus/primus), which Exprimus uses internally)

if you want to share sessions with express, you'll have to get express-session and cookie-parser:
```
npm install --save cookie-parser express-session
```

## Usage:

```javascript
var express = require('express')
,   Exprimus = require('exprimus')
;

var app = express()
,   pApp = Exprimus(app)
;
pApp.set('transformer','engine.io'); //or whatever engine you're using
```

Then, add `<script src="/primus/primus.js">` to your template, while testing. Later, you can use `pApp.save(path)` to save the file somewhere.

From thereon, use pApp instead of app to define routes:
```javascript
pApp.get('/data/:id',function(req,res,next){
    var id = req.param('id');
    if(req.isSocket){ // this is a primus request
        res.send({title:id});
    }
    else{ // this is a normal request
        res.render('somepage',{title:id});
    }
})
```

You can use `get`, `put`, `delete`, `post`, and `use`, as normal.

From the client, you would do:
```javascript
var primus = new Primus();
primus.write('/data/123');
//or
primus.write({url:'/data/123'});
//or
primus.write({url:'/data/123',method:'post'}); //method defaults to get

primus.on('data',function(data){
    console.log(data)    
});
```

## Partial Renders

If you want partial renders on the server side, you'll have to do a few things:

First, edit your layout, and make it conditional:
```jade
if (!skipLayout)
    doctype html
    html
        head
            script(src="/primus/primus.js")
        body
            block content
else
    block content
```

Primus augments the locals with a `skipLayout` property; that way, you do not have to render the layout when serving a real-time request.

Then, use pApp instead or app to set the views settings:
```javascript
pApp.set('views', path.join(__dirname,'views'));
pApp.set('view engine', 'jade');
```

Then just use res.render as normal:

```javascript
pApp.get('/',function(req,res){
    res.render('index',{title:'home'}); // will work for primus and express requests
});
```

on the client, the rendered template will be received in a property called `render`:
```javascript
primus.on('data',function(data){
    if(typeof data !== 'string'){
        if(data.render){data = data.render;}
        else{data = '<pre>'+JSON.stringify(data)+'</pre>';}
    }
    document.getElementById('something').innerHTML = data;
});
```

## Session persistence

```javascript
pApp.set('secret','shhh, very secret');
pApp.set('store',new pApp.session.MemoryStore());
pApp.session();
```

Provided you have installed `cookie-parser` and `express-session`.

## Example:

checkout the example:

- `git clone https://github.com/xananax/exprimus.git`
- `cd exprimus/example && npm install`
- `npm start`

## Stable?

More or less. As long as you stick to the example and you don't have exotic needs, it should work.

## License

MIT
