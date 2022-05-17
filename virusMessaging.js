export class ServerStatusReportMessage {
	constructor(serverName, lastTargetServer) {
		this.serverName = serverName;
		this.lastTargetServer = lastTargetServer
	}
}

export class BatchStatusReportMessage {
	constructor(serverName, lastTargetServer, batchId, batchType) {
		this.serverName = serverName;
		this.lastTargetServer = lastTargetServer
		this.batchId = batchId;
		this.batchType = batchType;
	}
}

export async function sendMessageOnPort(ns, port, objectToSend) {
	var messageSent = false;
	var messageToSend = JSON.stringify(objectToSend);
	messageSent = await ns.tryWritePort(port, messageToSend);
	while (!messageSent) {
		await ns.sleep(250);
		messageSent = await ns.tryWritePort(port, messageToSend);
	}
}