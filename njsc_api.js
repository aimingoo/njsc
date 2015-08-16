// -----------------------------------------------------------------------------
// -- NJSCA: Chana standard api/interfaces for njsc
// -- Author: Aimingoo
// -- Copyright (c) 2015.05
// --
// -- dependencies:
// --	npm install request
// --
// -- usages:
// --	centre = require('./njsc_api.js')
// --	centre = require('./njsc_api.js').option(opt)
// -- and
// --	centre(model, op, id, ...)
// -- or
// --	centre = require('./njsc_api.js').at('account')
// --	centre = require('./njsc_api.js').option(opt).at('account')
// --	centre(op, id, ...)
// --
// -- history:
// -- 	v1.1.0 support keepalive agent and custom headers, fix bug for multi-centre.
// -----------------------------------------------------------------------------

var centre_opt = {
	headers: {
		"Content-Type":		"text/plain; charset=UTF-8"
	},
	host:	'127.0.0.1',
	port:	'8080',
	method:	'POST',
	path:	''			// no '/' at tail
}

//-- normal/check interface
//	http://127.0.0.1:8080/ping

//-- Documents
//	https://github.com/wandoulabs/chnan#restful-api

//-- op for record
// centre(model, 'get',		id)					 -- is 'GET' http_method
// centre(model, 'put',		id, value)

//-- op for record with key
// centre(model, 'get',		id, key)
// centre(model, 'put',		id, key, value)

//-- op for record with avpath
// centre(model, 'select',	id)					 -- is select_op with avpath: '.'
// centre(model, 'select',	id, avpath)
// centre(model, 'update',	id, avpath, value)

//-- op for Array / Map only. use avpath.
// centre(model, 'insert',	id, avpath, value)
// centre(model, 'insertall',id, avpath, KVs)
// centre(model, 'clear',	id, avpath)
// centre(model, 'delete',	id, avpath)

//-- op for schema
// centre(model, 'putschema', schema)
// centre(model, 'putschema', schema, params)	-- params = {fullname=aString, timeout=aNumber}
// centre(model, 'delschema')					-- is 'GET' http_method

//-- op for script
// centre(model, 'putscript', field, scriptid, script)	-- <script> is function/string, or object with 'run' property.
// centre(model, 'delscript', field, scriptid)	-- is 'GET' http_method

module.exports = function(baseOpt) {
	var request = require('request');

	function AStroeScriptFactory(fieldName, scriptId, func) {
		function functionBody(func) {
			with ((func||this).toString()) return slice(indexOf('{') + 1, lastIndexOf('}'))
		}

		// <func> is a String, function, or object with <.run> member.
		//	- if <func> is object, then all properties will put into script context's <variants>
		function variantsDefine(fieldName, func) {
			var variants = ['var fieldName = "' + fieldName + '", _script_id = "' + scriptId + '"'];
			if (func && typeof func == 'object') {
				Object.keys(func).forEach(function(key) {
					if (key != 'run') {
						if (typeof func[key] == 'function') {
							variants.push(key + ' = ' + func[key].toString())
						}
						else {
							variants.push(key + ' = ' + JSON.stringify(func[key]))
						}
					}
				})
				if (func.run) func = func.run
			}
			// variants.push("fixedGet = function(url) { print('>>>', url); return http_get.apply(url.toString() ) }");
			// variants.push("fixedPost = function(url, body) { print('>>>', url, body); return http_post.apply(url.toString(), body.toString()) }");
			variants.push("fixedGet = function(url) { return http_get.apply(url.toString() ) }");
			variants.push("fixedPost = function(url, body) { return http_post.apply(url.toString(), body.toString()) }");
			variants.push("ScriptContext = function(record, fields, http_get, http_post) {" +
			// variants.push("ScriptContext = function(record, fields) {" +
				(func ? (typeof func == 'function' ? functionBody(func) : func.toString()) : '') +
			"}");
			return variants.join(', ');
		}

		function ScriptExecutor() {
			function AsClosedObject(me, Ids) {
				return new JSAdapter({ get: function(name) {return me.get(name)} }, {
					__get__: function(name) { return me.schema.getField(name) ? me.get(name) : undefined },
					__has__: function(name) { return me.schema.getField(name) !== null },
					__put__: function(name, value, field) { (field = me.schema.getField(name)) && me.put(field.pos(), value) },
					__getIds__: function() { return Ids || ([].forEach.call(me.schema.getFields(), function(item){ this.push(item.name()) }, Ids=['get']), Ids) },
				})
			}
			function AsFields(me, Ids) {
				var fields = {};
				[].forEach.call(me, function(field) { fields[this[this.length] = field._1.name()] = field._2 }, Ids=[])
				return (new JSAdapter({
					__get__: function(name) { return fields[name] },
					__has__: function(name) { return Ids.indexOf(name) },
					__getIds__: function() { return Ids }
				}))
			}

			try {
				// ScriptContext(AsClosedObject(record), AsFields(fields));
				ScriptContext(AsClosedObject(record), AsFields(fields), fixedGet.apply=fixedGet, fixedPost.apply=fixedPost);
			}
			catch (e) { print('[ERROR-JS] .' + fieldName + '/' + id + '/' + _script_id + ':', e.message) }
		}

		return variantsDefine(fieldName, func) + ';\n' +
			functionBody(ScriptExecutor).replace(/^\t\t\t/mg, '');
	}

	var NJSCA = function(model, op, id, avpath) {
		var msg, callback, params, option = Object.create(this), last = arguments.callee.length;
		switch (op) {
			case 'get': 	// [model, 'get', id, cb]
				if (typeof avpath === 'function') {
					callback = avpath
					avpath = undefined
				}
				else {		// [model, 'get', id, field, cb]
					callback = arguments[last]
				}
				option.method = 'GET'
				break
			case 'put': 	// [model, 'put', id, msg, cb]
				callback = arguments[last]
				if (typeof callback === 'function') {
					msg = avpath
					avpath = undefined
				}
				else { 		// [model, 'put', id, field, msg, cb]
					msg = callback
					callback = arguments[last + 1]
				}
				break
			case 'update': 	// [model, '<op>', id, avpath, msg, cb]
			case 'insert':
			case 'insertall':
				msg = arguments[last]
				callback = arguments[last + 1]
				break
			case 'select': 	// [model, 'select', id, cb]
				if (typeof avpath === 'function') {
					callback = avpath
					avpath = '.'
				}
				else {		// [model, 'select', id, avpath, cb]
					callback = arguments[last]
				}
				break
			case 'clear':	// [model, '<op>', id, avpath, cb]
			case 'delete':
				callback = arguments[last]
				break
			case 'putschema':	// [model, 'putschema', msg, cb]
				msg = id
				if (typeof avpath === 'function') {
					callback = avpath
				}
				else { 			// [model, 'putschema', msg, params, cb]
					params = avpath
					callback = arguments[last]
				}
				id = undefined
				avpath = undefined
				break;
			case 'delschema': 	// [model, 'delschema', cb]
				callback = id
				avpath = id = undefined
				option.method = 'GET'
				break
			case 'putscript': 	// [model, 'putscript', field, scriptid, msg, cb]
				msg = AStroeScriptFactory(id, avpath, arguments[last])	// <id> is fieldName, <avpath> as scriptId
				callback = arguments[last+1]
				break;
			case 'delscript':	// [model, 'delscript', field, scriptid, cb]
				callback = arguments[last]
				option.method = 'GET'
				break;
			default:
				throw new Error('Unknow Astore Op.')
		}

		var paths = [option.uri];
		if (op == 'putschema' || op == 'delschema') {
			paths.push(op, model)
		}
		else if (op == 'putscript' || op == 'delscript') {
			paths.push(model, op, id, avpath) 	// push <id> as $field, and <avpath> as $scriptid
			avpath = undefined
		}
		else {
			paths.push(model, op, id)
			if (avpath !== undefined && option.method === 'GET') {
				paths.push(avpath)
				avpath = undefined
			}
		}

		var param, value, paramArr = [];
		for (param in params) {
			switch (typeof(value = params[param])) {
				case 'undefined': break;
				case 'boolean':
					(value === true) && paramArr.push(param); break;
				default:
					(value !== null) && paramArr.push(param + '=' + value.toString());
			}
		}
		var url = paths.join('/') + (paramArr.length > 0 ? '?' + paramArr.join('&') : '')
		var cb = callback || (function(error, response, body) {
			var c = response && response.statusCode && response.statusCode.toString().charAt(0)
			if (error || (c != '2')) {
				console.log(['[', error, ']'].join(''), response && response.statusCode, body)
			}
		});

		var req = { url: url, headers: option.headers, agent: option.agent }
		var method = option.method.toLowerCase();
		if (method != 'get') { // build body for POST/PUT/...
			var body = (typeof msg === 'object' ? JSON.stringify(msg) : (msg === undefined ? "" : msg.toString()))
			if (avpath !== undefined) {
				body = avpath + (body === "" ? "" : '\n' + body)
			}
			req.body = body;
		}
		request[method](req, cb)
	}

	// bind options to NJSCA()
	var njsca_bind = function(opt) {
		var opt = opt || {}, newOpt = Object.create(baseOpt);

		Object.getOwnPropertyNames(opt).forEach(function(key) {
			newOpt[key] = opt[key]
		})

		if (!('uri' in opt)) {
			newOpt.uri = [
				newOpt.protocol || 'http',
				'://',
				newOpt.host,
				newOpt.port ? ':' + newOpt.port : '',
				newOpt.path || ''
			].join('');
		}

		if (!('method' in newOpt)) {
			newOpt.method = 'GET'
		}

		// property extension: agent
		if ('agent' in opt) {
			newOpt.agent = opt.agent
		}

		// property extension: headers
		if ('headers' in opt) { // full clone headers
			newOpt.headers = {};
			Object.getOwnPropertyNames(baseOpt.headers).forEach(function(key) {
				this[key] = baseOpt.headers[key]
			}, newOpt.headers);
			Object.getOwnPropertyNames(opt.headers).forEach(function(key) {
				this[key] = opt.headers[key]
			}, newOpt.headers);
		}

		return NJSCA.bind(newOpt)
	}

	// get forked njsca with at()
	var NJSCA_at = function(model) {
		if (! model) return this;

		var self = this, defaultModel = model;
		var njsca_at = function() {
			// return NJSCA.apply(this, [model].concat([].slice.call(arguments, 0)))
			[].unshift.call(arguments, defaultModel);
			return self.apply(null, arguments)
		}
		njsca_at.option = function() {
			self = njsca_bind.apply(self, arguments);
			return this
		}
		njsca_at.at = function(model) {
			defaultModel = model;
			return this
		}
		return njsca_at
	}

	// get new standard njsca with opt
	var NJSCA_option = function() {
		var njsca = njsca_bind.apply(this, arguments)
		njsca.option = NJSCA_option;
		njsca.at = NJSCA_at;
		return njsca
	}

	return NJSCA_option();
}(centre_opt)
