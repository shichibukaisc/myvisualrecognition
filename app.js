/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();
/*
var globalVar = "My name is Cool!";
app.get('/testing123.html', function(req, res, next) {
	res.send(globalVar);
});*/

var fs = require('fs');

var crypto = require('crypto');

var multer  = require('multer');
var path = require('path');

var storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      if (err) return cb(err);

      cb(null, raw.toString('hex') + path.extname(file.originalname));
    });
  }
});

var upload = multer({ storage: storage });

//var upload = multer({ dest: 'uploads/' });

// Bootstrap application settings
//require('./config/express')(app);

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

var userName = "";
var password = "";

//parse VCAP_SERVICES if running in Bluemix
if (process.env.VCAP_SERVICES) {
	var env = JSON.parse(process.env.VCAP_SERVICES);
	console.log(env);
	//find the Streams Geo service
	if (env['visual_recognition'])
	{
		userName = env['visual_recognition'][0]['credentials']['username'];
		password = env['visual_recognition'][0]['credentials']['password'];
	}
	else
	{
		console.log('You must bind the Visual Recognition service to this application');
	}
}

var watson = require('watson-developer-cloud');
var visual_recognition = watson.visual_recognition({
  version: 'v2-beta',
  username: '3e023e8a-293f-42df-b46d-14a61d804fc6',
  password: 'tfAjfZuTTRAG',
  version_date: '2015-12-02'
});

function convertClassifyObjToJson(result) {
  var jsonresult = [];
  if (result && result.images) {
    result.images.forEach(function(image) {
      image.scores.forEach(function(score) {
      	console.log("Name:" + score.name);
      	console.log("Name:" + score.score);
      	jsonresult.push({name: score.name, score: score.score});
      });
    });
  }
  return jsonresult;
}

app.post('/image.me', upload.single('imagetobeclass'), function(req, res, next) {
//app.post('/image.me', app.upload.single('imagetobeclass'), function(req, res, next) {
	//res.send(req.file);
	//console.log(req.file);
	//console.log(req.file.originalname);
	if(req.file.fieldname == "imagetobeclass") {
		
		/*fs.readFile(req.file.path, function (err, data) {
			console.log(req.file.path);
			console.log(err);
			res.writeHead(200, {'Content-Type': 'image/gif' });
			res.end(data, 'binary');
		});*/

	    //fs.readFile(req.file.path, function (err, data) {
			// ...
			//res.writeHead(200, {'Content-Type': 'image/gif' });
			//res.end(data, 'binary');
			
			//var path = require('path');
			//path.join(__dirname, req.file.path);
			console.log(req.file.path);
			var imagetobeclassified = fs.createReadStream(req.file.path);
			//var imagetobeclassified = fs.createReadStream("public/images/test.jpg");
			//var imagetobeclassified = fs.createReadStream("uploads/1f9ea910961093f6936dcb657094d88e.jpg");
			//var imagetobeclassified = data;
			var params = {
			    images_file: imagetobeclassified
			  };
			  console.log("before calling visual");
			
			  visual_recognition.classify(params, function(err2, results) {
			  	console.log("start of visual classify function");
			    // delete the recognized file
			    if (req.file)
			      fs.unlink(req.file.path);
			      
				console.log("unlinked successful");
				
			    if (err2){
			      console.log(err2);
			      res.send("Some error occured");
			      
			      //return next(err);
		    	} else {
		    	  //console.log(JSON.stringify(convertClassifyObjToJson(results)));
			      res.contentType('application/json');
				  res.send(JSON.stringify(convertClassifyObjToJson(results)));
		    	}
			  });
			
		//});
	} else {
		res.send("Error Uploading File");
	}


});

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {

	// print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
