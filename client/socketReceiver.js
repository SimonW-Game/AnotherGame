socket.on("messageReceived", function (newMessage) {
    var messages = document.getElementById("messages");
    let div = document.createElement("div");
    div.append(newMessage);
    messages.append(div);
});
//# sourceMappingURL=socketReceiver.js.map