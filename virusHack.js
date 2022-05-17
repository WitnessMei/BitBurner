/** @param {NS} ns */

export async function main(ns) {
	var waitMsTillExecution = ns.args[3];
	if(waitMsTillExecution == null || waitMsTillExecution < 0){
		waitMsTillExecution = 0;
	}
	await ns.sleep(waitMsTillExecution);
	await hackServer(ns, ns.args[0], ns.args[1], ns.args[2]);
}

export async function hackServer(ns, targetServerName, scriptServerName, masterScriptPort) {
	await ns.hack(targetServerName);
}