var primus = new Primus();
primus.on('data',function(data){
	if(typeof data !== 'string'){
		if(data.render){data = data.render;}
		else{data = '<pre>'+JSON.stringify(data)+'</pre>';}
	}
	Answer.innerHTML = data;
});
function send(url,data){
	if(!data){data = {};}
	else if(typeof data == 'string'){
		data = {data:data};
	}
	data.url = url;
	primus.write(data);
}

var Answer = document.getElementById('answer');
var Form = document.getElementById('form');
console.log(Form,'sdfsdf');
Form.onsubmit = function(event){
	event.preventDefault();
	var text = Form.text.value;
	var url = Form.data.checked ? '/data/'+text : '/'+text;
	send(url);
	return false;
}