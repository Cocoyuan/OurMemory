var express = require('express');
var multer = require('multer');
var _ = require('underscore');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var nodes = { };
var usernames = {};
server.listen(process.env.PORT || 3000);

app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.use(express.methodOverride());
app.use(express.bodyParser());  
app.use(app.router);
app.use('/public', express.static('public'));

app.use(multer({
    dest: './uploads/',
    rename: function (fieldname, filename) {
        return filename + "_" + Date.now();
    },
    onFileUploadStart: function (file) {
        console.log(file.originalname + ' is starting ...')
    },
    onFileUploadComplete: function (file) {
        console.log(file.fieldname + ' uploaded to  ' + file.path)
        done = true;
    }
}));

app.post('/api/photo', function (req, res) {
    if (done == true) {
        console.log(req.files);
        res.end("File uploaded.");
    }
});

app.get('/', function (req, res) {
  res.render('index');
  res.sendfile('index');
});

io.sockets.on('connection', function(socket) {
	socket.on('sendchat', function (data) {
		io.sockets.emit('updatechat', socket.username, data);
	});

	socket.on('adduser', function(username) {
		socket.username = username;

		usernames[username] = username;

		socket.emit('servernotification', { connected: true, to_self: true, username: username });

		socket.broadcast.emit('servernotification', { connected: true, username: username });

		io.sockets.emit('updateusers', usernames);
	});

	socket.on('addphoto', function(photo){
	 	io.sockets.emit('updatealbum', photo);
	});

	// when the user disconnects.. perform this
	socket.on('disconnect', function(){

		delete usernames[socket.username];

		io.sockets.emit('updateusers', usernames);

		socket.broadcast.emit('servernotification', { username: socket.username });
	});
});
