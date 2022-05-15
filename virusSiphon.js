/** @param {NS} ns */
export async function main(ns) {
	var targetServer = ns.args[0];
	var numThreads = ns.args[1];
	if (targetServer == null || targetServer == "") {
		targetServer = ns.getHostname();
	}
	if (numThreads == null || numThreads == 0) {
		numThreads = 1;
	}
	while (true) {
		var serverMaxMoney = ns.getServerMaxMoney(targetServer);
		var serverMoneyThreshold = serverMaxMoney * 0.05;
		var serverMinSecurity = ns.getServerMinSecurityLevel(targetServer);
		var serverMoneyAvailable = ns.getServerMoneyAvailable(targetServer);
		var serverSecurityLevel = ns.getServerSecurityLevel(targetServer);
		while (serverSecurityLevel > serverMinSecurity + 1) {
			await ns.weaken(targetServer);
			serverSecurityLevel = ns.getServerSecurityLevel(targetServer);
		}
		var growthRate = 0;
		while (serverMoneyAvailable < serverMoneyThreshold || growthRate > (1 + (0.025 * numThreads))) {
			growthRate = await ns.grow(targetServer);
			ns.print("growthRate: " + growthRate);
			serverMoneyAvailable = ns.getServerMoneyAvailable(targetServer);
		}
		await ns.hack(targetServer);
	}
}