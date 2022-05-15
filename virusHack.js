/** @param {NS} ns */
import * as Messaging from "virusMessaging.js";

export async function main(ns) {
	await hackServer(ns, ns.args[0], ns.args[1], ns.args[2]);
}

export async function hackServer(ns, targetServerName, scriptServerName, masterScriptPort) {
	await ns.hack(targetServerName);
	var messageToSend = Object.create(Messaging.ServerStatusReportMessage);
	messageToSend.serverName = scriptServerName;
	messageToSend.lastTargetServer = targetServerName;
	await Messaging.sendMessageOnPort(ns, masterScriptPort, messageToSend);
}