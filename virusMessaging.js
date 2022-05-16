export class ServerStatusReportMessage {
  constructor(serverName, lastTargetServer) {
    this.serverName = serverName;
	this.lastTargetServer = lastTargetServer
  }
}

export class BatchStatusReportMessage {
	constructor(serverName, lastTargetServer, batchId) {
	  this.serverName = serverName;
	  this.lastTargetServer = lastTargetServer
	  this.batchId = batchId;
	}
  }

export async function sendMessageOnPort(ns, port, objectToSend){
	var messageSent = false;
	var messageToSend = JSON.stringify(objectToSend);
	messageSent = await ns.tryWritePort(port, messageToSend);
	while (!messageSent) {
		await ns.sleep(500);
		messageSent = await ns.tryWritePort(port, messageToSend);
	}
}