/** @param {NS} ns */
import * as Messaging from "BitBurner/virusMessaging.js";

export async function main(ns) {
	var waitMsTillExecution = ns.args[3];
	if(waitMsTillExecution == null || waitMsTillExecution < 0){
		waitMsTillExecution = 0;
	}
	//maybe in future instead of sleeping it can monitor all virusScripts with batch id, and report back when they're all complete.
	await ns.sleep(waitMsTillExecution);
	await respondToMaster(ns, ns.args[0], ns.args[1], ns.args[2], ns.args[4]);
}

export async function respondToMaster(ns, targetServerName, scriptServerName, masterScriptPort, batchId) {
	var messageToSend =  new Messaging.BatchStatusReportMessage(scriptServerName, targetServerName, batchId);
	await Messaging.sendMessageOnPort(ns, masterScriptPort, messageToSend);
}