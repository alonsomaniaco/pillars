var util = require('util'); // Incluimos la libreria 'util' de NodeJS.
var pillars = require('../../pillars.js').global().configure({
	uploadsDirectory : './uploads',
	tempDirectory : './temp',
	requestIds : false,
	templatesCache : false
});

var app = new App();
app.languages = ['es','en'];
app.database = 'primera';
app.start();
app
	.add(new Pillar({id: 'examples',path: '/'})
		.add(new Beam({id: 'file',path: '/source'},function(gw){
			// Envimaos el archivo app.js de la aplicación al cliente.
			gw.file('./app.js','Mi primera aplicación Pillars.js');
		}))
		.add(new Beam({id: 'redirection',path: '/redirect'},function(gw){
			gw.redirect('http://www.google.es');
		}))
		.add(new Beam({id: 'json-content',path: '/json'},function(gw){
			// Enviamos una respuesta aplication/json, para verla correctamente comprueba que tu navegador es capaz de interpretar este tipo de contenido.
			gw.send({a:'A',b:'B',c:'C'});
		}))
		.add(new Beam({id: 'cache-control',path: '/cache'},function(gw){
			// Comprobamos el funcionamiento de cacheck, creamos una fecha antigua:
			var lastmod = new Date(0);
			if(!gw.cacheck(lastmod)){
				gw.send('Este contenido no ha sido modificado desde '+lastmod.toUTCString());
			}
			// No es necesario contemplar el 'else' ya que cacheck emitira un '304' automaticamente si es necesario.
			// Puedes comprobar en la consola la respuesta '304' y probar sucesivamente escribiendo cualquier parametro query.
		}))
		.add(new Beam({id: 'template',path: '/mypage'},function(gw){
			// Comprobamos el funcionamiento de render con el template de ejemplo.
			// El template espera las variables {title,h1 y contents}
			gw.render('./example.jade',{
				title: 'Mi primer template en Pillars',
				h1: 'Ejemplo de template básico',
				contents: '<strong>Hola mundo!</strong>'
			})
		}))
		.add(new Beam({id: 'custom-error',path: '/error/:error'},function(gw){
			// Utilizaremos los parametros en la ruta para probar cualquier codigo de error, los más comunes tienen una traducción predeterminada.
			if(['400','403','404','406','408','413','500'].indexOf(gw.params.error)>=0){
				gw.error(parseInt(gw.params.error),new Error('Probando página de error de forma manual.'));
			} else {
				gw.error(404,new Error('El codigo de error no está en la lista.'));
			}
		}))
		.add(new Beam({id: 'timeout',path: '/wait'},function(gw){
			// Si no respondemos a la solicitud se devolvera un '408', tiempo de la solicitud agotado.
			// El tiempo de espera puede configurarse mediante pillars.configure({timeout:milisegundos});
		}))
		.add(new Beam({id: 'auto-handled-erros',path: '/hups'},function(gw){
			// Si se genera algun error no manejado en el código de nuestro Beam se emitira un Error500 con el trazado del error y se cerrara la conexión.
			var c = a + b; // Cometemos un error intencionado.
			// Los errores 500 son tambien trazados por consola.
		}))
		.add(new Beam({id: 'authenticate',path: '/secret'},function(gw){
			// Este contenido solo sera visible bajo autenticación.
			// comprobamos si exite autenticación y es correcta, en caso contrario utilizamos .authenticate(msg):
			if(gw.auth && gw.auth.user=='admin' && gw.auth.pass=='1234'){
				gw.render('./example.jade',{
					title: 'El sentido de la vida, el universo y todo lo demás',
					h1: 'El sentido de la vida, el universo y todo lo demás',
					contents: '<h2>42</h2><blockquote><p>The Hitchhiker´s Guide to the Galaxy</p></blockquote>'
				})
			} else {
				gw.authenticate('Es necesario usuario y clave para ver este contenido');
			}
		}))
		.add(new Beam({id: 'proxy',path: '/proxy/*:path',upload:'ignore'},function(gw){
			// Transparent proxy redirection.
			gw.proxy({port:3001,path:(gw.params.path || '')});
		}))		
		.add(new Beam({id: 'maintenance',path: '/cerrado'},function(gw){
			// Esto servira de página "En mantenimiento".
			gw.send("closed for maintenance");
		}))
		.add(new Beam({id: 'maintenance-close',path: '/cerrar'},function(gw){
			// Moveremos la pagina de mantenimiento a una proridad mayor y configuraremos su ruta para que capture cualquier ruta posible.
			// Con esto mantendremos el sitio inaccesible.
			var maintenance = app.get('examples').get('maintenance');
			maintenance.path = '/*:path';
			maintenance.priority = 2;
			gw.send("closed!");
			// Mediante este ejemplo podemos comprobar como el router aplica cualquier cambio en las rutas de forma automatica.
			// Tambien comprobamos como modificar nuestro entorno de trabajo en tiempo de ejecución.
		}))
		.add(new Beam({id: 'maintenance-open',path: '/abrir',priority:1},function(gw){
			// Esta ruta prevalecera al 'maintenance', permitiendonos volver a 'abrir' el sitio.
			var maintenance = app.get('examples').get('maintenance');
			maintenance.path = '/cerrado';
			maintenance.priority = 1000;
			gw.send("open!");
		}))
	)
	// Creamos un nuevo Pillar con funciones adicionales, un home con nuestro codigo fuente y una utilidad para trazar variables globales.
	.add(new Pillar({id: 'tools',path: '/',priority:1})
		.add(new Beam({id: 'status',path: '/'},function(gw){
			// Mostramos la información de estado actual de nuestra app.
			gw.send("<pre>"+util.inspect(app.routes,{depth:4})+"</pre>"); // util inspect da formato a un objeto JS para poder mostrarlo como String.
		}))
		.add(new Beam({id: 'gangway',path: '/request'},function(gw){
			// Mostramos algunas de las propiedades de gw vistas anteriormente:
			gw.send("<pre>"+util.inspect({
				cookie:gw.cookie,
				ua:gw.ua,
				ip:gw.ip,
				host:gw.host,
				method:gw.method,
				path:gw.path,
				query:gw.query,
				params:gw.params,
				files:gw.files,
				session:gw.session,
				referer:gw.referer
			},{depth:4})+"</pre>");
		}))
		.add(new Beam({id: 'console.log',path: '/console/log/:varName'},function(gw){
			// Podremos capturar cualquier ruta con el formato "/console/log/xxx" y recibir como parametro 'xxx' utilizando el prefijo ':'.
			// Tambien podemos usar el prefijo '*:' para capturar cualquier sucesión de directorios en vez de uno solo.
			// En este caso permitimos elegir una variable global para mostrar:
			gw.send("<pre>"+util.inspect(global[gw.params.varName],{depth:4})+"</pre>");
		}))
	)
;

app
	.add(new Pillar({id: 'static',path: '/static'})
		.add(new Beam({id: 'main',path: '*:path',directory:'./static',directoryListing:true},precasts.directory))
	)
;


var app2 = new App().start(3001)
	.add(new Pillar({id: 'root',path: '/'})
		.add(new Beam({id: 'all',path: '/*:path',origin:'*'},function(gw){
			console.log({params:gw.params,cookie:gw.cookie});
			gw.send('hola');
		}))
	)
;


/* The Pillars Hello world */
/*
Routing on two steps:
You can organize your controllers (Beam) on logic groups (Pillar).
Pillar describe the first common part of the path, priority and maybe the hostname {path:'/examples',host:'sub.hostname.ext',priority:10},
Beam describe the rest of the path, the method and prority {method:['get','post'],path:'/case1',priority:42} and set the handler/midleware.
The App router check the Pillar list, and only check Beams if necesary.
The router is dinamic, you can add, remove, change priority, id or path, method... any change is aplied by the router in running App.
Gangway is abstraction of request+response, it's have all you need, width easy names and methods.
*
var pillars = require('pillars').global();

var app = new App().start()
	.add(new Pillar({id:'examples1', path:'/examples1'})
		.add(new Beam({id:'sendFile', path:'/source'},function(gw){
			gw.file('./app.js','source.js'); // support cache, http streaming, compression, forced download, file name...
		}))
		.add(new Beam({id:'sendJSON', path:'/json'},function(gw){
			// gw is a request+response abstraction with all you need and dream in one object.
			gw.send(
				session : gw.session,
				params:  gw.params,
				ip: gw.ip, 
				routes: app.routes
			);
		}))
		.add(new Beam({id:'params', path:'/params/:param1', method:['get','post']},function(gw){
			gw.send({
				query: gw.query, // only query params.
				path: gw.pathParams, // only path params, in this case 'param1'.
				content: gw.content.params, // only content params, forms POST, multipart...
				files: gw.files, // only files received.
				all: gw.params // all params mixed, preference: path>content>query
			});
		}))
		.add(new Beam({id: 'sendHTML',path: '/html'},function(gw){
			gw.send('<h1>Hello world!</h1>');
		}))
		.add(new Beam({id: 'sendHTMLtemplate',path: '/template'},function(gw){
			gw.render('./template.ext',{title:'Hello world'}); // Multi engine based on extensions, and cache control.
		}))
		.add(new Beam({id: 'cacheControl',path: '/cache'},function(gw){
			var oldDate = new Date(0); // This content modification time, very old content.
			if(!gw.cachek(oldDate)){ // If client haven't this content cached...
				gw.send('Vey old content!');
			}
			// .cacheck(Date) send 304 if content is cached and return true, if not return false. In both cases set the last modification date for the response.
		}))
		.add(new Beam({id: 'static',path: '/static/*:path',directory:'./',directoryListing:true},precasts.directory))
	)
	.add(new Pillar({id: 'examples2',path: '/examples2'})
		.add(app.get('examples1').get('sendFile')) // Use the same Beam.
		.add(new Beam({id: 'removeExamples',path: '/remove'},function(gw){
			global.examples1 = app.get('examples1'); // Dirty save before remove Pillar.
			app.remove('examples1');
		}))
		.add(new Beam({id: 'mountExamples',path: '/mount'},function(gw){
			// remount Examples1 if removed.
			if(global.examples1){app.add(global.examples1);}
		}))
		.add(new Beam({id: 'changePriority',path: '/priority'},function(gw){
			var oldRoutes = app.routes;
			app.get('examples2').priority = 10; // this change the sort in routes.
			var newRoutes = app.routes;
			console.log({oldRoutes:oldRoutes,newRoutes:newRoutes});
		}))
		.add(new Beam({id: 'middleWare',path: '/check/:name/:password'},
			function(gw,next){
				if(gw.params.name=='Walter'){
					next();
				} else {
					gw.send('Incorrect name!');
				}
			},
			function(gw){
				if(gw.params.password=='White'){
					gw.send('Ok, ok... follow me.');
				} else {
					gw.send('Say my name!');
				}
			}
		))
	)
;

/* */










/* Modelator example (on progress) */


var systemModel = new modelator.Schema('system',{
	app : app,
	collection : 'system',
	limit : 5,
	filter : ['_id','field1','field2'], 
	headers : ['_id','_img','field1','field2','reverse']
})
	.addField('Text','field1')
	.addField('Checkbox','fieldCheck')
	.addField('Checkboxes','fieldCheckboxes',{
		values : ['A','B','C','D']
	})
	.addField('Radios','fieldRadios',{
		values : ['A','B','C','D']
	})
	.addField('Select','field2',{
		values : ['A','B','C','D'],
		keys : {
			//see : 'manager',
			//edit : 'manager'
		}
	})
	.addField('Time','fieldTime')
	.addField('Reference','fieldRef',{
		collection : 'system',
		headers : ['_id','_img','field1','field2','reverse']
	})
	.addField('Img','_img')
	.addField('Reverse','reverse')
	.addField(new modelator.List('listFiles')
		.addField('Img','file')
		.addField('Text','text')
	)
	.addField(new modelator.List('list')
		.addField('File','file')
		.addField('Text','field2')
		.addField('Reverse','reverse')
	)
	.addField('Editor','texti18n',{i18n : true})
	.addField('Text','field3')
	.addField(new modelator.Subset('thesubset')
		.addField('Text','subset1')
		.addField('Text','subset2')
		.addField('Text','subset3')
	)
;

var systemPillar = new Pillar({
	id:'sample-pillar',
	path:'/system'
});
precasts.crudBeams(systemPillar,systemModel);
app.add(systemPillar);



// Translations/Textualizations for system schema (es,en).

textualization.load('schemas.system',{
	en:{
		title: "System",
		details: "Example CRUD administration",
		h1: "System administration",
		headers: {
			'_id': "Id",
			'field1': "Field 1",
			'field2': "Field 2",
			'reverse': "Reverse"
		},
		fields: {
			'field1': {label: "Field 1",details: "Field 1 details"},
			'fieldCheck': {},
			'fieldCheckboxes': {},
			'fieldRadios': {},
			'field2': {},
			'fieldTime': {},
			'fieldRef': {},
			'_img': {},
			'reverse': {},
			'listFiles': {label: "Images",details: "Image list"},
			'listFiles.file': {},
			'listFiles.text': {},
			'list': {label: "List",details: "Example list"},
			'list.file': {},
			'list.field2': {},
			'list.reverse': {},
			'texti18n': {},
			'field3': {},
			'thesubset': {label: "Group",details: "Example group fields"},
			'thesubset.subset1': {},
			'thesubset.subset2': {},
			'thesubset.subset3': {}
		}
	},
	es:{
		title: "System",
		details: "Administracion CRUD de ejemplo",
		h1: "Administrando el schema system 2",
		headers: {
			'_id': "Identificador",
			'field1': "Campo 1",
			'field2': "Campo 2",
			'reverse': "Invertido"
		},
		fields: {
			'field1': {label: "Campo 1",details: "Detalles del campo 1"},
			'fieldCheck': {label: "Campo 2",details: "Detalles del campo 1"},
			'fieldCheckboxes': {},
			'fieldRadios': {},
			'field2': {},
			'fieldTime': {},
			'fieldRef': {},
			'_img': {},
			'reverse': {},
			'listFiles': {label: "Imágenes",details: "Listado de imágenes"},
			'listFiles.file': {},
			'listFiles.text': {},
			'list': {label: "Listado",details: "Listado de ejemplo"},
			'list.file': {},
			'list.field2': {},
			'list.reverse': {},
			'texti18n': {},
			'field3': {},
			'thesubset': {label: "Grupo",details: "Grupo de campos de ejemplo"},
			'thesubset.subset1': {},
			'thesubset.subset2': {},
			'thesubset.subset3': {}
		}
	}
});
