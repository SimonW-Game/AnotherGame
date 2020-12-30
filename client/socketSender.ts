namespace server {
	export function sendMessage(message: string) {
		socket.emit("sendMessage", message);
	}
}