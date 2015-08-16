/**
 * simple promised sample
**/

var chana_options = {addr: {uri: 'http://localhost:8080'}};
var chana = require("../njsc.js")(chana_options);

// promise helper
var unpack = function(array) {
	return this.apply(null, array)
}

// case 1: promise at schema/model
var client = chana.promiseAt('user');
client('putschema', 
	JSON.stringify(require("./schema/demo.js")),
	{fullname: 'com.wandoujia.chana.demoschema.User', timeout: 2*60*60*1000}
).then(function(args) {	// case 2: Native args
	console.log('Ok, ', args[2])
	return client('select', 'me')
}).then(unpack.bind(function(error, response, body) { // case 3: Convert args to arguments
	console.log('Ok, ', body)
}));