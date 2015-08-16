// -----------------------------------------------------------------------------
// -- NJSC: Chana In NodeJS
// -- Author: Aimingoo
// -- Copyright (c) 2015.05
// --
// -- usages:
// --	a = require('njsc')(opt)
// -- and
// --	a.server_info('*', callback)
// --	centre = a.workAt('YOUR_MODEL')
// --	centre('get', '12345')	-- '12345' is key
// -- history:
// -- 	v1.1.0 support channel_info() and promiseAt()
// -----------------------------------------------------------------------------

module.exports = function(opt) {
	var fieldName = 'server_info',
		fieldPath = '.' + fieldName,
		models = {},
		versions = {
			'1.0': {	// A AVRO RECORD SCHEMA
				type: 'record',
				name: 'ServerInfoKeys',
				fields: [{ name: fieldName, type: {type: 'map', values: 'string'} }]
			},
			'1.1': {	// A AVRO RECORD SCHEMA
				type: 'record',
				name: 'ServerInfoKeys',
				fields: [{ name: fieldName, type: {
					type: 'map', values: {
						type: 'record', name: 'ServerInfoKeysValue', fields: [
							{ name: "key", type: "string" },
							{ name: "value", type: "string" }
						]
					}
				} }]
			}
		},
		option = {
			server_info_struct: versions.default = versions['1.0'],
			server_info_model: 'server_info_keys',
			server_njsa_opt: {	// object of {uri} or {protocol, host, port, path}
				uri: 'http://127.0.0.1:8080'
			}
		},
		self;

	opt && opt.model && (option.server_info_model = opt.model);
	opt && opt.addr && (option.server_njsa_opt = opt.addr);
	opt && opt.version && (option.server_info_struct = versions[opt.version] || versions.default);
	return (self = {
		// list server information:
		// 	- chnan.workAt()('select', '__1__', '.server_info', cb)
		//		OR
		//	- chnan.server_info('*', cb)
		server_info: function(key, value) {
			var centre = self.workAt(), id = '__1__', args = [].slice.call(arguments, 0);
			if (typeof value == 'function') { // op is 'select'
				centre.apply(centre, ['select', id,
					(key == '*' ? fieldPath : fieldPath + '("' + key + '")')
				].concat(args.slice(1)));
			}
			else {
				if (key == '*') {  // update with a object
					centre.apply(centre, ['update', id, fieldPath].concat(args.slice(1)));
				}
				else {  // insert a value
					var val = {}; val[key] = value;
					centre.apply(centre, ['insert', id, fieldPath, val].concat(args.slice(2)));
				}
			}
		},
		// list communication channels
		// 	- value_in_map = {name:channelName, value:receiverUri}
		channel_info: function(channelName) {
			arguments[0] = '/' + channelName + '/'; // reformat channelName
			self.server_info.apply(this, arguments);
		},
		workAt: function(model) {
			return models[model || (model = option.server_info_model)] || (models[model] =
				require('./njsc_api.js').option(option.server_njsa_opt).at(model));
		},
		promiseAt: function(model) {
			function wsCallback(resolve, reject) {
				return function(error, response, body) {
					var c = response && response.statusCode && ''.charAt.call(response.statusCode, 0)
					if (error || (c != '2')) {
						reject(Object.defineProperty(new Error('wsError'), 'args', {value: arguments}))
					}
					else {
						resolve(arguments)
					}
				}
			}
			var centre = self.workAt(model);
			return function() {
				var self = this, args = [].slice.apply(arguments);
				return new Promise(function(resolve, reject) {
					try {
						centre.apply(self, args.concat([wsCallback(resolve, reject)]))
					}
					catch(e) { reject(e) }
				})
			}
		},
		schema: function(modPath) {
			return JSON.stringify(modPath ? require(modPath) : option.server_info_struct)
		}
	})
}
