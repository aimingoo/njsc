/**
 * module managment
**/
var toPromise = function(func, thisObject) {  // convert function to Promise, append callback function
	function wsSuccess(error, response, body) {
		var c = response && response.statusCode && ''.charAt.call(response.statusCode, 0)
		return !(error || (c != '2'));
	}
	function wsCallback(resolve, reject) {
		return function() {
			if (! wsSuccess.apply(this, arguments)) {
				reject(Object.defineProperty(new Error('wsError'), 'args', {value: arguments}))
			}
			else {
				resolve(arguments)
			}
		}
	}
	return function() {
		var self = thisObject || this, args = [].slice.apply(arguments);
		return new Promise(function(resolve, reject) {
			try {
				func.apply(self, args.concat([wsCallback(resolve, reject)]))
			}
			catch(e) { reject(e) }
		})
	}
}

/* ======================== core information model ======================
server_info_keys = {
	'__1__' : {
		server_info: {
			start_info: <start_time_or_other_information, "ServerInfoKeys" struct defined in njsc.js>
		}
	},
	...
}
*/
module.exports = function(chana, chana_env) {
	var server_info = toPromise(chana.server_info);
	var module_initializing = function(module_name) {
		var m_version = module_name.match(/[\_\-\.]([\d\.]+)$/) || [];
		var version = version || m_version[1] || 'final';
		var short_name = m_version[0] ? module_name.replace(new RegExp(m_version[0]+'$'), '') : module_name;
		return server_info(module_name + '_init')
			.then(function(args) {
				// return body is '[]', in model 1.1, record ServerInfoKeysValue default is null
				if (! (args[2] && JSON.parse(args[2])[0])) {  // getSelectedResult(args)
					return require('./modules/'+module_name).init(chana, chana_env)
						.then(function() {
							return server_info(module_name + '_init',
								{ key: module_name + '_init', value: version })
						})
						.then(function() {
							return server_info(module_name + '_init')
						});
				}
				return Promise.resolve(args)
			})
			.then(
				function(args) {
					console.log(short_name + ' loaded, version: ' + (args[2] && JSON.parse(args[2])[0] || {}).value);
					return args
				},
				function(e) {
					console.log(short_name + ' load, FAIL.');
					return Promise.reject(e)
				}
			);
	}

	return {
		server_info: server_info,
		module_initializing: module_initializing,
		core_module_initializing: function() {
			return Promise.all([
				chana.promiseAt()(
					'putschema',
					chana.schema()
				).then(function(args) {  // args = [error, response, body]
					console.log('chana system core information module initializing, result: ' + args[2]);
					// sleep 3s, waiting putschema into all nodes
					return new Promise(function(next) { setTimeout(next, 3000) })
				}).then(function() { 	// put start_info now
					return server_info('start_info',
						{ key: 'start_info', value: new Date().toString() + '\nversion: 1.1' })
				})
			])
		}
	}
}
