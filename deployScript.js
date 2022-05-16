/** @param {NS} ns */
export async function deployFileToServerAsync(ns, fileName, serverName) {
	await ns.scp(fileName, ns.getHostname(), serverName);
}