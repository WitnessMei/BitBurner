/** @param {NS} ns */
export async function deployFileToServerAsync(ns, fileName, serverName) {
	ns.print("Deploying to " + serverName);
	ns.enableLog("ALL");
	await ns.scp(fileName, ns.getHostname(), serverName);
	ns.disableLog("ALL");
}