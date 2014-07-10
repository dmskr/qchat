
var qchatApp = angular.module('qchatApp', []);

qchatApp.controller('MessagesList', ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
  $scope.users = []; // Users connected to the same room
  $scope.user = {}; // Currently logged in user
  $scope.message = {}; // Message the user is about to post

  $scope.messages = [];

  $scope.postMessage = function(message) {
    message = message || { 'text': $scope.message.text, 'sender': $scope.user.name || 'Anonimus', 'createdAt': new Date() };
    $http.post('/room/messages', { 'message': message }).success(function(data, status) {
      $scope.message = {};
    });
  }

  $scope.refreshUsers = function() {
    $http.get('/room/users').success(function(data, status){
      $scope.users = ((data || {}).users || []).exclude(function(user) { return user.name == $scope.user.name; });
    });
  };

  $scope.setUserName = function() {
    if ($scope.user.name) {
      $scope.user.joinedAt = new Date();
      $('#myModal').modal('hide');
      for(var i= 0; i < $scope.messages.length; i++) {
        $scope.messages[i].sender = $scope.user.name
      }
      $scope.connect();
      $scope.postMessage({
        'text': '[joinded the chat]',
        'sender': $scope.user.name || 'Anonimus',
        'type': 'newuser',
        'createdAt': new Date()
      });
      $scope.refreshUsers();
    }
  }

  $scope.exit = function() {
    if (confirm('Are you sure you want to leave the chat?')) {
      var thisWindow = window.open(window.location, '_self');
      thisWindow.close();
    }
  }

  $scope.connect = function() {
    var responseLen = 0;
    var http = new XMLHttpRequest();
    http.onreadystatechange = function() {
      if (this.readyState > 2) {
        var response = this.responseText;
        var diff = response.substring(responseLen);
        responseLen = response.length;
        var message = JSON.parse(diff);
        $scope.messages.push(message);
        if (message.type && message.type == 'newuser')
          $scope.refreshUsers();
        $scope.$apply();
      }
    }

    http.open('get', '/room/messages?user=' + $scope.user.name, true);
    http.send();
  }

  $('#myModal').modal({
    backdrop: 'static',
    keyboard: false
  });
  $('#myModal').modal('show');
  
}]);

