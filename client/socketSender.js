var server;
(function (server) {
    function sendMessage(message) {
        socket.emit("sendMessage", message);
    }
    server.sendMessage = sendMessage;
})(server || (server = {}));
//# sourceMappingURL=socketSender.js.map