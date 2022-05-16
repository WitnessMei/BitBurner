/** @param {NS} ns */
import * as Messaging from "/BitBurner/virusMessaging.js";

export async function main(ns) {
	var waitMsTillExecution = ns.args[3];
	if(waitMsTillExecution == null || waitMsTillExecution < 0){
		waitMsTillExecution = 0;
	}
	await ns.sleep(waitMsTillExecution);
	await growServer(ns, ns.args[0], ns.args[1], ns.args[2]);
}

export async function growServer(ns, targetServerName, scriptServerName, masterScriptPort) {
	await ns.grow(targetServerName);
	var messageToSend = Object.create(Messaging.ServerStatusReportMessage);
	messageToSend.serverName = scriptServerName;
	messageToSend.lastTargetServer = targetServerName;
	await Messaging.sendMessageOnPort(ns, masterScriptPort, messageToSend);
}