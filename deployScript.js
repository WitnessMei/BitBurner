/** @param {NS} ns */
export async function deployFileToServerAsync(ns, fileName, serverName) {
	ns.print("Deploying to " + serverName);
	await ns.scp(fileName, ns.getHostname(), serverName);
}