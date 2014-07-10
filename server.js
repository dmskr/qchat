require('sugar');

var Hapi = require('hapi');
var Stream = require('stream');

var server = new Hapi.Server(8081, 'localhost', {
  views: {
    engines: {
      html: require('ejs')
    },
    path: 'static'
  }
});

var room = {};
room.channel = new Stream.PassThrough();
room.users = [];

var startTime = new Date();

server.route({
  path: '/',
  method: 'GET',
  handler: function(request, reply) {
    reply.view('index', { st: startTime.getTime() });
  }
})

server.route({
  path: '/room/messages',
  method: 'GET',
  handler: function(request, reply) {
    var messages = new Stream.PassThrough();
    var response = reply(room.channel.pipe(messages));
    response.code(200)
      .type('text/messages')
      .header('Connection', 'keep-alive')
      .header('Cache-Control', 'no-cache')
      .header('Content-Encoding', 'identity');

    request.once('disconnect', function () {
      room.users.remove(function(user) { return user.name == request.query.user; });
      room.channel.write(JSON.stringify({
        'type': 'newuser',
        'sender': request.query.user,
        'text': '[left the chat]',
        'createdAt': new Date()
      }));
      messages.end();
    });
  }
})

server.route({
  path: '/room/messages',
  method: 'POST',
  handler: function(request, reply) {
    var sender = (request.payload.message || {}).sender;
    if (!room.users.find(function(user) { return user.name == sender; })) {
      room.users.push({
        joinedAt: new Date(),
        name: sender
      });
    }
    room.channel.write(JSON.stringify(request.payload.message));
    reply.redirect('/');
  }
})

server.route({
  path: '/room/users',
  method: 'GET',
  handler: function(request, reply) {
    reply({ users: room.users });
  }
})

server.route({
  path: '/{path*}',
  method: 'GET',
  handler: {
    directory: {
      path: './static',
      listing: false,
      index: true
    }
  }
})

server.start(function() {
  console.log("Hapi server started @ " + server.info.uri);
});

//process.on('exit', function(code) {
  //room.channel.end();
//});
//process.on('SIGINT', function() {
  //room.channel.end();
//});

module.exports.server = server;
module.exports.room = room;

