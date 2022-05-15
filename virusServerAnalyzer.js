/** @param {NS} ns */
export class HackWeakenGrow {
	static Hack = new HackWeakenGrow("hack");
	static Weaken = new HackWeakenGrow("weaken");
	static Grow = new HackWeakenGrow("grow");

	constructor(name) {
		this.name = name
	}
}

export async function shouldHackWeakenGrow(ns, serverName) {
	//Start inferring future values based on what actions are currently happening to the target server.
	//grow/hack increase potentional security values, increase/decrease money value etc.

	var targetServer = serverName;
	if (targetServer == null || targetServer == "") {
		targetServer = ns.getHostname();
	}
	var serverMaxMoney = ns.getServerMaxMoney(targetServer);
	var serverMoneyThreshold = serverMaxMoney * 0.05;
	var serverMinSecurity = ns.getServerMinSecurityLevel(targetServer);
	var serverMoneyAvailable = ns.getServerMoneyAvailable(targetServer);
	var serverSecurityLevel = ns.getServerSecurityLevel(targetServer);
	if (serverSecurityLevel > (serverMinSecurity + 1)) {
		return HackWeakenGrow.Weaken;
	} else {
		ns.print("Server " + serverName + " Security - CUR: " + serverSecurityLevel + " MIN: " + serverMinSecurity + 1);
	}
	if (serverMoneyAvailable < serverMoneyThreshold) {
		return HackWeakenGrow.Grow;
	}else {
		ns.print("Server " + serverName + " Money - CUR: " + serverMoneyAvailable + " MIN: " + serverMoneyThreshold);
	}
	return HackWeakenGrow.Hack;
}