var Lab = require('lab'),
    app = require('../server'),
    Stream = require('stream');

Lab.experiment('Server', function() {
  Lab.beforeEach(function(done) {
    if (app.room.channel) app.room.channel.end();
    app.room.channel = new Stream.PassThrough(); // Reload channel
    app.room.users = []; // Reload user list
    done();
  });
  Lab.experiment('Root page', function() {
    Lab.test('should render successfully', function(done) {
      var options = {
        method: 'GET',
        url: '/'
      };

      app.server.inject(options, function(response) {
        Lab.expect(response.statusCode).to.equal(200);
        done();
      });
    });
  });
  Lab.experiment('GET /room/messages', function() {
    Lab.test('should set correct headers', function(done) {
      var options = {
        method: 'GET',
        url: '/room/messages'
      };

      app.room.channel.end(); // End the messages stream

      app.server.inject(options, function(response) {
        Lab.expect(response.headers.connection).to.equal('keep-alive');
        Lab.expect(response.headers['cache-control']).to.equal('no-cache');
        done();
      });
    });
    Lab.test('should propagate messages from the main channel', function(done) {
      var options = {
        method: 'GET',
        url: '/room/messages'
      };

      app.room.channel.write('Hey, QChatters');
      app.room.channel.end(); // End the messages stream

      app.server.inject(options, function(response) {
        Lab.expect(response.payload).to.equal('Hey, QChatters');
        done();
      });
    });
  });
  Lab.experiment('POST /room/messages', function() {
    Lab.test("should post messages to the main channel in JSON format", function(done) {
      var options = {
        method: 'POST',
        url: '/room/messages',
        payload: {
          message: {
            text: "Qu-Qquu.",
            sender: "Hipster"
          }
        }
      };

      var result = '';
      app.room.channel.on('data', function(chunk) {
        result += chunk.toString();
      });
      app.server.inject(options, function(response) {
        Lab.expect(result).to.equal(JSON.stringify(options.payload.message));
        done();
      });
    });
    Lab.test("should store the sender in a list of users connected to the room", function(done) {
      var options = {
        method: 'POST',
        url: '/room/messages',
        payload: {
          message: {
            text: "Qu-Qquu.",
            sender: "Hipster"
          }
        }
      };

      app.server.inject(options, function(response) {
        Lab.expect(app.room.users.length).to.equal(1);
        Lab.expect(app.room.users[0]).to.equal('Hipster');
        done();
      });
    });
    Lab.test("should store the sender only once", function(done) {
      var options = {
        method: 'POST',
        url: '/room/messages',
        payload: {
          message: {
            text: "Qu-Qquu.",
            sender: "Hipster"
          }
        }
      };

      app.server.inject(options, function(response) {
        app.server.inject(options, function(response) {
          app.server.inject(options, function(response) {
            Lab.expect(app.room.users.length).to.equal(1);
            Lab.expect(app.room.users[0]).to.equal('Hipster');
            done();
          });
        });
      });
    });
  });
  Lab.experiment('GET /room/users', function() {
    Lab.test('should return all users connected to the room', function(done) {
      var options = {
        method: 'GET',
        url: '/room/users'
      };

      app.room.users = ['Hipster', 'Fellow'];
      app.server.inject(options, function(response) {
        Lab.expect(response.result.users.length).to.equal(2);
        Lab.expect(response.result.users[0]).to.equal('Hipster');
        Lab.expect(response.result.users[1]).to.equal('Fellow');
        done();
      });
    });
  });
});

