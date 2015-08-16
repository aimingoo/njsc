/**
 * Sample: simple init the schema/model
**/

var schema_file = '../schema/demo.js'
var model_name = 'user'
var model_options = {
	fullname: 'com.wandoujia.chana.demoschema.User',
	timeout: 2*60*60*1000
}

module.exports.init = function(chana, env) {
	var model = chana.promiseAt(model_name)
	return model('putschema', JSON.stringify(require(schema_file)), model_options)
		.then(function(args) {  // args = [error, response, body]
			console.log('chana['+model_name+'] initializing, result: ' + args[2]);
		})
}