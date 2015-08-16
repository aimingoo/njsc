/**
 * Sample: init schema with scripts
**/

var schema_file = '../schema/demo.js'
var model_name = 'activity'
var model_options = {
	fullname: 'com.wandoujia.chana.demoschema.ActivityRecord',
	timeout: 2*60*60*1000
}

module.exports.init = function(chana, env) {
	var self = this, model = chana.promiseAt(model_name)
	return model('putschema', JSON.stringify(require(schema_file)), model_options)
		.then(function(args) {  // args = [error, response, body]
			console.log('chana['+model_name+'] initializing, result: ' + args[2]);
		})
		.then(function() {
			return self.init_scripts(chana, env)
		})
}

module.exports.init_scripts = function(chana, env) {
	var model = chana.promiseAt(model_name)
	var script_sample = function(id, record, fieldName, fields, print, http_get, http_post) {
		if (record.numFriends.length > 5) {
			print('more friends: ', record.numFriends.length)
		}
	}
	return model('putscript', 'numFriends', 'more_friends', script_sample)
}