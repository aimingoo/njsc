Scripts load tool for chana
===

Usage:
	> node load.js <schema.field | field> <scripts/xxx.js | script_id_for_del> [/del]

Examples:

# load sample.js to test model/schema, and attach to activities field
  > node load.js test.activities modules/scripts/sample.js

# load sample.js to test model/schema, and attach ...
#  - the "test" is default model name
  > node load.js activities modules/scripts/sample.js

# remove script from chana, script attach at "test.activities" field
#  - the "testme" is default subsystem_name
  > node load.js activities testme_activities_sample /del


Note:
 please update the load.js script, reset/change these variants:
	- njsc_options
	- config_in_script_content
	- default_schema
	- subsystem_name