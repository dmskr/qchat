var Hapi = require('hapi');
var Stream = require('stream');

var server = new Hapi.Server(8081, 'localhost', {
  views: {
    engines: {
      jade: require('jade')
    },
    path: './views'
  }
});

var channel = new Stream.PassThrough();

server.route({
  path: '/',
  method: 'GET',
  handler: function(request, reply) {
    reply.view('room')
  }
})

server.route({
  path: '/room/messages',
  method: 'GET',
  handler: function(request, reply) {
    var messages = new Stream.PassThrough();
    var response = reply(channel.pipe(messages));
    response.code(200)
      .type('text/messages')
      .header('Connection', 'keep-alive')
      .header('Cache-Control', 'no-cache')
      .header('Content-Encoding', 'identity');

    request.once('disconnect', function () {
      messages.end();
      console.log('Listener closed');
    });
  }
})

server.route({
  path: '/room/messages',
  method: 'POST',
  handler: function(request, reply) {
    channel.write(request.payload.message);
    reply.redirect('/');
  }
})

server.route({
  path: '/static/{path*}',
  method: 'GET',
  handler: {
    directory: {
      path: './public',
      listing: false,
      index: false
    }
  }
})

server.start(function() {
  console.log("Hapi server started @ " + server.info.uri);
});

process.on('exit', function(code) {
  channel.end();
});
process.on('SIGINT', function() {
  channel.end();
});

module.exports.server = server;
module.exports.channel = channel;
module.exports.reloadChannel = function() {
  if (channel) channel.end();
  module.exports.channel = channel = new Stream.PassThrough();
};

