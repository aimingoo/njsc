/**
 * standard initializing processes sample 
 *	- with modules loader and managment
**/

var chana_options = {addr: {uri: 'http://localhost:8080'}, version: '1.1'};
var chana = require("../njsc.js")(chana_options);
var modules = require("./modules.js")(chana, chana_options);  // module managment in njsc

// promise helper
var unpack = function(array) {
	return this.apply(null, array)
}

/* actions
 *  - nop					: skip step/steps, nothings
 *	- init_scripts_again	: init it again
 *	- wait_amoment			: sleep at client to sync server action
**/
var nop = undefined;
var wait_amoment = function() {
	return new Promise(function(next) { setTimeout(next, 3000) })
}

// callbacks
var wsSuccess = function(error, response, body) {
	var c = response && response.statusCode && ''.charAt.call(response.statusCode, 0)
	return !(error || (c != '2'));
}
var wsErrorLog = unpack.bind(function (error, response, body) {
	console.log(['[', error, ']'].join(''), response && response.statusCode, body)
})
var getSelectedResult = unpack.bind(function (error, response, body) {
	return body && JSON.parse(body)[0]
})

/**************************************************************
 *	main()
 *	 - all module files in ./modules/*
**************************************************************/
var load_modules = function() {
	return Promise.all([
		modules.module_initializing('activity_module-1.0.0'),
		modules.module_initializing('user_module-0.0.1')
	])
}

modules.server_info('start_info')
	// a chana hacker at here
	.then(function(args){
		return getSelectedResult(args) ? Promise.resolve(args)  // replay
			: Promise.reject(Object.defineProperty(new Error('wsError'), 'args', {value: args}))
	})
	// schema exist checker, and initializer
	.then(nop, function(e) {  // core module loader
		if (e.message != 'wsError') return Promise.reject(e);
		return modules.core_module_initializing()
			.then(wait_amoment)
			.then(load_modules)
			.then(function() { return modules.server_info('start_info') });
	})
	// done
	.then(
		function(args) {  // get http response
			console.log(getSelectedResult(args).value)
		},
		function(e) {  // catch err by network or connection
			(e.message == 'wsError') ? wsErrorLog(e.args) : console.log(e.stack);
		}
	);
