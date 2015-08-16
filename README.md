njsc
====

Chana In NodeJS. The Chana is Avro Data Store based on Akka.

-   The Chana renamed from astore, so the njsc renamed from njsa too.

NJSC include two modules:

-   njsc\_api.js

    -   NJSCA: Chana standard api/interfaces for njsc

-   njsc.js

    -   NJSC: Chana In NodeJS

about Chana to see: https://github.com/wandoulabs/chana

The contents of current document:

- [Installation](#installation)
- [Usage](#usage)
- [Schema define](#base-avro-schema-and-schema-define-by-jsonjs)
- [Standard API](#njsca-standard-apiinterfaces)
- [Enhanced script support](#enhanced-script-support-for-chana)
- [NJSC: Chana In NodeJS](#njsc-chana-in-nodejs)
- [History and update](#history)

------------

install NJSC package by npm:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
$ npm install njsc
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Usage
-----

1). install chana and run it, see:

<https://github.com/wandoulabs/chana#run-chana>

2). get chana configure (\$CHANA is install direcotry)

for develop environment:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
$ cd $CHANA/src/main/resources
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

or in released directory:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
$ cd $CHANA/conf
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

read these configures:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
$ grep -A3 'chana.web' application.conf
chana.web {
  interface = "127.0.0.1"
  port = 8080
}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

and, try base detect interface (must run chana first)

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
$ echo `curl -s 'http://127.0.0.1:8080/ping'`
pong
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

3). in nodejs, run samples

change testcase connection arguments to your chana configures:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
$ cd njsc/test
$ grep -H -Pne 'chana_options |require\(.*\.option\(' t_*.js
t_njsc.js:12:var chana_options = {addr: {uri: 'http://localhost:8080'}};
t_njsc_api.js:10:var user_centre = require('../njsc_api.js').option({uri: 'http://127.0.0.1:8080'}).at('user')
t_njsc_api.js:11:var activities = require('../njsc_api.js').option({uri: 'http://127.0.0.1:8080'}).at('activity')
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

and run it

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
$ node t_njsc_api.js
$ node t_njsc.js
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Base avro schema (and schema define by json/js)
-----------------------------------------------

you must initialition chana with a entity schema define. the define must is a
record or union type, and putschema to chana(if union, need a fullname
argument).

examples:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var modelName = 'user'
var centre = require('../njsc_api.js').at(modelName)
var schemaContent = JSON.stringify(require("./schema/demo.js"))
var entityOption = {
  fullname: 'com.wandoujia.chana.demoschema.User',
  timeout: 2*60*60*1000
}
var callback = function(error, response, body) {}
centre('putschema', schemaContent, entityOption, callback)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

#### modelName

NJSC can work at multi-model chana environment, a model stands for a schema and
its activities for all entities. a entity is actor in chana runtime(scala
actor).

#### centre

It's command centre, got it by require njsc\_api module:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
centre = require('../njsc_api.js')
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The centre is a function with base command/function call format:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function(modelName, opName, id, ...) // op of <id> in <model>
// or
function(modelName, opName, ...)   // op of <model> in chana
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

you can re-option it(the options see: [nodejs \<request\>
module](<http://github.com/request/request>)):

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
centre = centre.option({
  host: '192.168.1.100'
})
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

and/or, bind the centre to a model:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
centre = centre.at(modelName)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

now, next calls will include a default mode name:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function(opName, id, ...) // op of <id> in <model>
// or
function(opName, ...)   // op of <model> in chana
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

#### schemaContent

The "./schema/demo.js" file is a schema with js format define(no, it's not json
define). so you can require the model and call JSON.stringify() of the result.

the js define need return a object(for arvo RECORD type), or array(for avro
UNION type). example:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// export array as union types
module.exports = [ActivityRecord, User];
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

the ActivityRecord/User is Javascript Object define.

#### fullname

if schema include union type, then must set \<fullname\> option when putschema.
the fullname include full-namespace, example:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var ActivityRecord = {
  name: 'ActivityRecord',
  namespace: "com.wandoujia.chana.demoschema",
  type: 'record', fields: [
    // ...
  ]
}

// export array as union types
module.exports = [ActivityRecord, ...];
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

for the case, \<ActivityRecord\> fullname is
"com.wandoujia.chana.demoschema.ActivityRecord".

#### callback

It's nodejs request module callback function, see: [nodejs \<request\>
module](<http://github.com/request/request>)

if none the argument, njsc\_api will use a default callback as console error
logger:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
function(error, response, body) {
    var c = response && response.statusCode && response.statusCode.toString().charAt(0)
    if (error || (c != '2')) {
        console.log(['[', error, ']'].join(''), response && response.statusCode, body)
    }
}
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

NJSCA: standard api/interfaces
------------------------------

the NJSCA module implement full api/interfaces for chana. include:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// op for record
centre(model, 'get',        id)
centre(model, 'put',        id, value)

// op for record with key
centre(model, 'get',        id, key)
centre(model, 'put',        id, key, value)

// op for record with avpath
centre(model, 'select', id)                  // is select_op with avpath: '.'
centre(model, 'select', id, avpath)
centre(model, 'update', id, avpath, value)

// op for Array / Map only. use avpath.
centre(model, 'insert', id, avpath, value)
centre(model, 'insertall',id, avpath, KVs)
centre(model, 'clear',  id, avpath)
centre(model, 'delete', id, avpath)

// op for schema
centre(model, 'putschema', schema)
centre(model, 'putschema', schema, params)  // params = {fullname=aString, timeout=aNumber}
centre(model, 'delschema')

// op for script
centre(model, 'putscript', field, scriptid, script) // <script> is function/string, or object with 'run' property.
centre(model, 'delscript', field, scriptid) // is 'GET' http_method
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

AVPATH see: <https://github.com/wandoulabs/avpath> RESTful-api see:
<https://github.com/wandoulabs/chana#restful-api>

enhanced script support for chana
---------------------------------

a script snippet is a "OnUpdate trigger" of entity field/member in chana. the
script is full support javascript(see [Nashorn javascript and extensions in
java8](<https://wiki.openjdk.java.net/display/Nashorn/Nashorn+extensions>). you
can use \<putscript\> op with a scriptContent block to hook it:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
centre(model, 'putscript', field, scriptid, script)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

or remove it:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
centre(model, 'delscript', field, scriptid)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

#### field argument

script snippet must hook a filed of entity record. when the field updated by any
instance of the record, chana will throw a event/callback and call your script
snippet.

once tigger will incluced some fileds(multi OnUpdate is merged). so you need
check who is changed(but, the NJSC can got current fieldName to help you process
it).

#### scriptid argument

any uniqued string to mark your scriptContent. a script content can invoke more
fields, if you can check/tag each filed. but, fieldName+scriptid must unique in
global of the chana.

#### script argument

in chana, script/scriptContent must is string and the content will run into a
function context. so, your \<putscript\> op must submit some lines/statements
only.

but NJSC support expanded script snippet/content/environment. you can get
enhanced features at the script argument. ex:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// 1. use script line/string
centre(model, 'putscript', fieldName, 'script_1', 'print("Updated.")')

// 2. use function
centre(model, 'putscript', fieldName, 'script_2', function(){
  print("Updated.")
})

// 3. use a object as custom context, the object has custom properties as variants,
//    and 'run' peroperty will as scriptContent put into chana.
centre(model, 'putscript', fieldName, 'script_3', {
  msg: 'hello, world.'
  name: 'BlackBean'
  run: function(){
    print(name + ' say: ' + msg)
  }
})
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

#### expanded script environment

1.  global variant \<record\> is standard js object in chana native environment,
    the \<record\> is warped java object. so you cant direct access any
    field/properties, only do these:

    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // in chana native environment
    value_1 = record.get('field_a')
    value_2 = record.get('field_b')
    ...
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    with NJSC, ex:

    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // with NJSC
    value_1 = record.field_a
    value_2 = record.field_b
    ...
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

2.  global variant \<fields\> is standard js object too in chana native
    environment, the \<fields\> is array of OnUpdate changeset. so you must
    enumerate fields to get a field/fieldValue by name. ex:

    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // in chana native environment
    var findFieldName = 'field_b', gotValue
    for (i=0; i<fields.length; i++)
      if (fields[i]._1.name() == findFieldName) {
    gotValue = fields[i]._2;
    break
      }
    }
    print(findFieldName+': ', gotValue || 'NO FOUND')
    ...
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    with NJSC, you can do these:

    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // with NJSC
    print('field_b: ', fields.field_b || 'NO FOUND')
    ...
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

3.  global variant \<fieldName\> will set to current changed field name in chana
    native environment, you cant know who changing. so you must put field names
    into script content in advance. but in NJSC, the \<fieldName\> is global
    variant. ex:

    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // in NJSC
    centre(model, 'putscript', 'field_b', 'script_2', function(){
      print(fieldName, 'oldValue: '+fields[fieldName], 'newValue: '+record[fieldName])
    })
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

4.  configurable script content in NJSC, a function or code snippet can invoke
    any fields, and support configurable arguments. ex: \`\`\`javascript // in
    NJSC function showUpdating() { print(fieldName+' changing['+id+']: ',
    record[fieldName]) http\_get.apply(config.notify\_uri + '?' + [ 'id=' + id,
    'oldValue=' + fields[fieldName], 'newValue=' + record[fieldName]].join('&'))
    }

// now you can invoke any fields with the the script, and notify some web
services var script\_1 = { config: { notify\_uri: 'http://localhost:8080/notify'
}, run: showUpdating }

var script\_2 = { config: { notify\_uri:
'http://remote\_host\_name/notify\_from\_chana' }, run: showUpdating }

centre(model, 'putscript', 'field\_a', 'script\_2', script\_1) centre(model,
'putscript', 'field\_b', 'script\_2', script\_2) \`\`\`

NJSC: Chana In NodeJS
----------------------

The NJSC isn't NJSCA. NJSC is a framework support for chana, but NJSCA is
standard interfaces.

NJSC work at multi-model environment too, and support custom system environment
version.

try run the testcase:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
> node node ./t_njsc.js 
chana[user] initializing successed, result: OK
chana[activities] initializing successed, result: OK
chana system core information module initializing successed, result: OK
chana start time: Tue Feb 17 2015 02:08:02 GMT+0800 (CST)
version: 1.0
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

try run again:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
> node node ./t_njsc.js 
chana start time: Tue Feb 17 2015 02:08:02 GMT+0800 (CST)
version: 1.0
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

so, the framework initializing once run anywhere. and you can check
schemas/environment version in chana, or restart/reset it.

put more system information into the environment:

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
var chana_options = {addr: {uri: 'http://localhost:8080'}};
var chana = require("../njsc.js")(chana_options);

// server_info write/read
chana.server_info('myinfo', 'hi, aimingoo.', function(){
  chana.server_info('myinfo', function(error, response, body){
    console.log(body)
  })
})
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

or get any njsca instance/model

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// work at multi-model
user_centre = chana.workAt('user')
activities_centre = chana.workAt('activities')
system_centre = chana.workAt()
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

or check system\_info schema, and/or load new schema as a new model

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
// print/recheck system core/framework schema
console.log(chana.schema())

// schema loader for <putschema> op
new_centre = chana.workAt('test')
new_centre('putschema', chana.schema('./schema/demo.js'))
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

# History
```text
2015.08.17  release njsc v1.1.0, renamed from njsa
    - support channel_info()
    - support promiseAt()
    - support modules loader and standard initialization 
    	- see: test/t_njsc.js
    - chana script load tool released
	    - see: tools/readme.txt
    - support keepalive agent and custom headers, fix bug for multi-centre.

2015.05     release njsa v1.0.0
```