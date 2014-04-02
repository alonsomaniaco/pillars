
var util = require('util');
var textualization = require('./lib/t12n');
textualization.languages(['es','en']);
var formwork = require('./lib/formwork');
var Pillar = require('./lib/Pillar');
var bricks = require('./lib/bricks');
var Beam = require('./lib/Beam');
var templates = require('./lib/template');
var fs = require('fs');

var server = formwork().mongodb('primera')

var mymodel = new bricks.Fieldset('system',{
	title : 'Un fieldset',
	details : 'Completa los campos',
	collection : 'system'
})
	.addField(new bricks.Text('field1',{
		label : 'Field1',
		details : 'Rellena este campo...'
	}))
	.addField(new bricks.Text('field2',{
		label : 'Field2',
		details : 'Rellena este campo...'
	}))
	.addField(new bricks.Reverse('reverse',{
		label : 'Reverse',
		details : 'Este va invertido en la bdd'
	}))
	.addField(new bricks.Textarea('textarea',{
		label : 'Textarea i18n',
		details : 'Un campo internacional'
	}))
	.addField(new bricks.Text('field3',{
		label : 'Field3',
		details : 'Rellena este campo...'
	}))
;

server.addPillar(new Pillar({
	id:'sample-pillar',
	title:'Configuración',
	path:'/system',
	template:'lib/crud.jade',
	t12n:'./lib/crud.t12n'
})
	.addBeam(new Beam('main',{session:true},function(){
		var gw = this;
		mymodel.list(gw,function(result){


			var timetag = ('TranslationTime').cyan;console.time(timetag);
			var translations = [
				gw.t12n("general.actionbutton",{context:'post',action:'new',num:5}),
				gw.t12n("general.actionbutton",{context:'post',action:'new',num:1}),
				gw.t12n("general.welcome",{genre:'female',num:3}),
				gw.t12n("general.welcome",{num:2}),
				gw.t12n("general.goobye",{genre:'female',num:3}),
				gw.t12n("general.logout"),
				gw.t12n("general.error",{error:'crashhhh!!!'}),
				gw.t12n("general.you_have_new_messages",0),
				gw.t12n("general.you_have_new_messages",1),
				gw.t12n("general.you_have_new_messages",20),
				gw.t12n("general.noexist",2),
				gw.t12nc(["clasical basic"]),
				gw.t12nc(["clasical %s here %s ..."],["Translation","now"]),
				gw.t12nc(["You have 1 mail","You have %s mails"],[0]),
				gw.t12nc(["You have 1 mail","You have %s mails"],[1]),
				gw.t12nc(["You have 1 mail","You have %s mails"],[30]),
				gw.t12nc("You have 1 message",[0]),
				gw.t12nc("You have 1 message",[1]),
				gw.t12nc("You have 1 message",[30]),
				gw.t12nc(["You no have mails","You have 1 mail","You have %s mails"],[0]),
				gw.t12nc(["You no have mails","You have 1 mail","You have %s mails"],[1]),
				gw.t12nc(["You no have mails","You have 1 mail","You have %s mails"],[18]),
				gw.t12nc("You no have messages",0),
				gw.t12nc("You no have messages",1),
				gw.t12nc("You no have messages",18)
			];
			console.timeEnd(timetag);


			gw.render({
				template:'crud-list',
				h1:'listado',
				data:result,
				trace:util.format(translations)
			});
		});
	}))
	.addBeam(new Beam('update',{path:'/edit/:_id',method:'(get|post)',session:true},BeamIds,function(){
		var gw = this;
		mymodel.update(gw,function(result){
			if(!result){
				gw.render({
					template:'crud-error',
					h1:'El elemento no existe'
				});
			} else {
				gw.render({
					template:'crud-update',
					h1:'Editando '+result._id,
					data:result,
					model:mymodel,
					trace:util.format(gw.pillar.beams)
				});
			}
		});
	}))
	.addBeam(new Beam('insert',{path:'/new',method:'(get|post)',session:true},BeamIds,function(){
		var gw = this;
		mymodel.insert(gw,function(result){
			if(!result._id){
				gw.render({
					template:'crud-insert',
					h1:'Nuevo ',
					data:result,
					model:mymodel
				});
			} else {
				gw.render({
					template:'crud-inserted',
					h1:'Insertado '+result._id,
					data:result,
					model:mymodel
				});
			}
		});
	}))
	.addBeam(new Beam('remove',{path:'/remove/:_id',method:'(get|post)',session:true},BeamIds,function(){
		var gw = this;
		mymodel.remove(gw,function(result){
			if(!result){
				gw.render({
					template:'crud-error',
					h1:'El elemento no existe'
				});
			} else {
				gw.render({
					template:'crud-removed',
					h1:'Borrado',
					data:result
				});
			}
		});
	}))
	.addBeam(new Beam('api-get',{path:'/api/get/:_id',session:true},BeamIds,function(){
		var gw = this;
		mymodel.one(gw,function(result){
			gw.send(result);
		});
	}))
);


server.addPillar(new Pillar({
	id:'staticfiles',
	title:'Static',
	path:'',
	template:'lib/static.jade'
})
	.addBeam(new Beam('css',{path:'/css/*:path',directory:'./static/css'},directory))
	.addBeam(new Beam('file',{path:'/file/*:path',directory:'./static/file'},directory))
	.addBeam(new Beam('img',{path:'/img/*:path',directory:'./static/img'},directory))
	.addBeam(new Beam('js',{path:'/js/*:path',directory:'./static/js'},directory))
);

function directory(){
	var gw = this;
	var path = gw.beam.config.directory+(gw.params.path || '');
	fs.stat(path, function(error, stats){
		if(error || (!stats.isFile() && !stats.isDirectory())){
			gw.error(404,'Not Found',error);
		} else if(stats.isDirectory()) {
			fs.readdir(path, function(error,files){
				if(error){
					gw.error(404,'Not Found',error);
				} else {
					gw.render({
						h1:decodeURIComponent(gw.originalPath.replace(/\/$/,'')),
						path:decodeURIComponent(gw.originalPath.replace(/\/$/,'')),
						data:files
					});
				}
			});
		} else if(stats.isFile()) {
			gw.file(path);
		}
	});
}

var ObjectID = require('mongodb').ObjectID;
function BeamIds(next){
	var gw = this;
	var _id = gw.params._id || "";
	var checkhexid = /^[a-f0-9]{24}$/;
	if(checkhexid.test(_id)){gw.params._id = new ObjectID.createFromHexString(_id);}
	next();
}



/* *
var memwatch = require('memwatch');
var hd = new memwatch.HeapDiff();
var leaks = [];
var stats = [];
memwatch.on('stats', function(_stats) {
	_stats.diff = hd.end();
	stats.push(_stats);
	hd = new memwatch.HeapDiff();
});
memwatch.on('leak', function(info) {
	leaks.push(info);
});
.addBeam(new Beam('stats',{path:'/stats'},function(){
	var gw = this;
	gw.send(stats);
}))
.addBeam(new Beam('leaks',{path:'/leaks'},function(){
	var gw = this;
	gw.send(leaks);
}))
/* */

/*

.addBeam(new Beam('download',{path:'/file',session:true},function(){
	var gw = this;
	gw.file('./uploads/exquisite0002.png','prueba.txt',false);
}))
.addBeam(new Beam('form',{path:'/form',method:'(get|post)',session:true,upload:true},function(){
	var gw = this;
	if(!gw.session.counter){gw.session.counter=0;}
	gw.session.counter++;

	var body = templates.render('./form.jade',{
		trace: util.format(gw),
		title:'Method test',
		h1:'Method testing:'
	});
	gw.send(body);	
}))

*/

//var filepath = path.replace(/[^\\\/]*$/,'');
//var filename = path.replace(/^.*[\\\/]/,'').replace(/\..*$/,'');
//var fileext = path.replace(/^.*[\.]/,'');

/* Emitter-mod *
var EventEmitter = require('events').EventEmitter;
EventEmitter.prototype.__emit = EventEmitter.prototype.emit;
EventEmitter.prototype.__onAll = function(type){console.log('{Event}--'+this.constructor.name+'('+type+')');}
EventEmitter.prototype.emit = function(){
	this.__onAll.apply(this,arguments);
	return this.__emit.apply(this,arguments);
}
/* */

/* *

function isUndefined(arg) {
  return arg === void 0;
}

function isString(arg) {
  return typeof arg === 'string';
}
function isBuffer(arg) {
  return arg instanceof Buffer;
}
function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

/* */

/*

 else {
			gw.setHeader('Allow',gw.beam.getConfig().methods.join(', ').toUpperCase());
			gw.error(405,'Method not allowed');
		}

*/
		/*
		if(/^\/contenido\/?$/.test(gw.path)){

			if(!gw.session.counter){gw.session.counter=0;}
			gw.session.counter++;

			var body = tiles.render('./form.jade',{
				//trace: util.format(gw),
				title:'Method test',
				h1:'Method testing:'
			});
			gw.send(body);	

		} else if(/^\/yalotengo\/?$/.test(gw.path)){
			if(!gw.cacheck(new Date(false))){
				gw.send('Este contenido es fijo y se cachea');
			}
		} else if(/^\/espera\/?$/.test(gw.path)){
			// Force timeout!
		} else if(/^\/redirecciona\/?$/.test(gw.path)){
			gw.redirect('http://localhost:3000/yalotengo');
		} else if(/^\/auth\/?$/.test(gw.path)){
			gw.authenticate();
		} else if(/^\/malapeticion\/?$/.test(gw.path)){
			gw.error(400,'Bad Request');// 405 Method not allowed 	Allow: GET, HEAD
		} else if(/^\/archivo\/?$/.test(gw.path)){
			gw.file('./uploads/exquisite0002.png','prueba.txt',false);
		} else if(/^\/error\/?$/.test(gw.path)){
			throw new Error("Crashhh!");
		} else {
			return false;
		}
		return true;
		*/
