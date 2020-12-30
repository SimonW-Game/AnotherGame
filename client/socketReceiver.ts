socket.on("messageReceived", function (newMessage) {
	var messages: HTMLElement = document.getElementById("messages");
	let div = document.createElement("div");
	div.append(newMessage);
	messages.append(div);
});