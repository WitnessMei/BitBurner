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
	while (!messageSent) {
		messageSent = await ns.tryWritePort(port, messageToSend);
		await ns.sleep(1000);
	}
}