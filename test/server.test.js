var Lab = require('lab'),
    app = require('../server');

Lab.experiment('Server', function() {
  Lab.beforeEach(function(done) {
    app.reloadChannel();
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

      app.channel.end(); // End the messages stream

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

      app.channel.write('Hey, QChatters');
      app.channel.end(); // End the messages stream

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
      app.channel.on('data', function(chunk) {
        result += chunk.toString();
      });
      app.server.inject(options, function(response) {
        Lab.expect(result).to.equal(JSON.stringify(options.payload.message));
        done();
      });
    });
  });
});

