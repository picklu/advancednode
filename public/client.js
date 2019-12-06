$( document ).ready(function() {
    const socket = io();
    socket.on('user count', function(data){
        console.log(data);
    });
  });