/*
 * load script into chana
 *
 * Usage:
 *	- node load.js <schema.field | field> <scripts/xxx.js | script_id_for_del> [/del]
 * Ex:
 *	> node load.js test.activities modules/scripts/sample.js
 *	> node load.js activities modules/scripts/sample.js
 *	> node load.js activities testme_activities_sample /del
***/

var njsc_options = {
	addr: { uri: 'http://localhost:8080' },
	model: "server_info_keys",	// default is "server_info_keys"
	version: '1.1'
};

var chana = require('njsc')(njsc_options);
var env = {addrUri: njsc_options.addr.uri, coreModel: njsc_options.model}
var config_in_script_content = {
	'chana_server_info': env.addrUri + '/' + (env.coreModel || 'server_info_keys'),
	'chana_model': env.addrUri + '/' + default_schema,
	'notify_url': 'http://localhost/test/callback?do='
};

var default_schema = 'test';
var subsystem_name = 'testme';

// agruments parse
var load_to = process.argv[2].split('.');
var load_from = process.argv[3];
var is_remove = (process.argv[4] || '').toLowerCase() == '/del';

if (load_to.length == 1) load_to.unshift(default_schema);
var schema = load_to[0], field = load_to[1];
var filename = load_from.replace(/.*\/|\.js$/g, '');  // shortname without extension
var script_id = [subsystem_name, field].concat(filename.split('.')).join('_')

// main()
var centre = chana.promiseAt(schema);
if (is_remove) {
	if (load_from.search(/\./) == -1) script_id = load_from;
	centre('delscript', field,  script_id).then(function(args) {
		console.log('script [', script_id, '] removed, result: ' + args[2]);
	});
}
else {
	var script_object = {
		'config': config_in_script_content,
		'run': require(load_from)
	}
	centre('putscript', field,  script_id, script_object).then(function(args) {
		console.log('script [', script_id, '] loaded, result: ' + args[2]);
	});
}