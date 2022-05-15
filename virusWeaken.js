/** @param {NS} ns */
import * as Messaging from "virusMessaging.js";

export async function main(ns) {
	var waitMsTillExecution = ns.args[3];
	if(waitMsTillExecution == null || waitMsTillExecution < 0){
		waitMsTillExecution = 0;
	}
	await ns.sleep(waitMsTillExecution);
	await weakenServer(ns, ns.args[0], ns.args[1], ns.args[2]);
}

export async function weakenServer(ns, targetServerName, scriptServerName, masterScriptPort) {
	await ns.weaken(targetServerName);
	var messageToSend = Object.create(Messaging.ServerStatusReportMessage);
	messageToSend.serverName = scriptServerName;
	messageToSend.lastTargetServer = targetServerName;
	await Messaging.sendMessageOnPort(ns, masterScriptPort, messageToSend);
}