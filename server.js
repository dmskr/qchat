var Hapi = require('hapi');
var Joi = require('joi');
var lout = require('lout');

var MemoryStream = require('memorystream');
var memStream = new MemoryStream(['Hello',' ']);

var Stream = require('stream');

var server = new Hapi.Server(8081, 'localhost', {
  cache: {
    engine: require('catbox-mongodb'),
    options: {
      partition: 'qchat'
    }
  },
  views: {
    engines: {
      jade: require('jade')
    },
    path: './views'
  }
});

var channel = new Stream.PassThrough();
var data = 0;
var interval = setInterval(function() {
    channel.write('data: ' + data++ + '\n\n')
    console.log('Sending data: ' + data);
}, 1000);

      //clearInterval(interval);


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
/*    console.log(request.payload);*/
    //var response = new MemoryStream(['Hello',' ']);
    /*reply(memStream.pipe(response));*/
})

//server.route({
  //path: '/room/messages',
  //method: 'POST',
  //handler: function(request, reply) {
    //console.log(request.payload);
    //reply('Done');
  //}
//})

server.route({
  path: '/room',
  method: 'GET',
  handler: function(request, reply) {
    reply.view('room', { first: '', last: '', age: '', color: ''})
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

server.route({
  path: "/log/{data}",
  method: "GET",
  handler: function(request, reply) {
      request.log(["pathData"]);
      reply("Logged " + request.params.data);
  }
});

server.start(function() {
  console.log("Hapi server started @ " + server.info.uri);
});

