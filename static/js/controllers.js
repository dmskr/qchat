
var qchatApp = angular.module('qchatApp', []);

qchatApp.controller('MessagesList', ['$scope', '$http', '$timeout', function($scope, $http, $timeout) {
  $scope.message = {}
  $scope.user = {}

  $scope.messages = [];

  $scope.postMessage = function(text) {
    $http.post('/room/messages', { 'message': { 'text': text || $scope.message.text, 'sender': $scope.user.name || 'Anonimus' }}).success(function(data, status) {
      $scope.message = {};
    });
  }

  $scope.setUserName = function() {
    if ($scope.user.name) {
      $('#myModal').modal('hide');
      for(var i= 0; i < $scope.messages.length; i++) {
        $scope.messages[i].sender = $scope.user.name
      }
      $scope.connect();
      $scope.postMessage('[joinded the chat]');
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
        console.log(diff);
        $scope.messages.push(JSON.parse(diff));
        $scope.$apply();
      }
    }

    http.open('get', '/room/messages', true);
    http.send();
  }

  $('#myModal').modal({
    backdrop: 'static',
    keyboard: false
  });
  $('#myModal').modal('show');
  
}]);

