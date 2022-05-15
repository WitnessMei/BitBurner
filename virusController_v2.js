/** @param {NS} ns */
//import { deployFileToServer, getNewServersToScan } from "deployScript.js";
import * as deployScripts from "deployScript.js";
import * as Messaging from "virusMessaging.js";
import * as ServerAnalyzer from "virusServerAnalyzer";

var listenPort = 1;
var handledServers = [];
var weakenScriptName = "virusWeaken.js";
var hackScriptName = "virusHack.js";
var growScriptName = "virusGrow.js"
var scriptsToDeploy = ["virusMessaging.js", "virusHack.js", "virusWeaken.js", "virusGrow.js"];
export async function main(ns) {
	await ns.sleep(5000);
	var distributedAttackTargetServer = ns.args[0];
	if (distributedAttackTargetServer == null || distributedAttackTargetServer == "") {
		distributedAttackTargetServer = ns.getHostname();
	}
	ns.disableLog("ALL");
	await spawnVirusAsync(ns, ns.getHostname(), distributedAttackTargetServer);
	await nukeServersAsync(ns, distributedAttackTargetServer);
	await listenForScriptUpdatesAsync(ns);
}

export async function listenForScriptUpdatesAsync(ns) {
	ns.print("Listening for messages...");
	while (true) {
		var message = await ns.readPort(1);
		if (message != "NULL PORT DATA" && message != null && message != "") {
			let serverStatusReportMessage = JSON.parse(message);
			ns.print("Recieved message " + message);
			let serverName = serverStatusReportMessage.serverName;
			let lastTarget = serverStatusReportMessage.lastTargetServer;
			if (!(message.serverName == ns.getHostname())) {
				await spawnVirusAsync(ns, serverName, lastTarget);
			}
		}
		await ns.sleep(250);
	}
}

export async function spawnVirusAsync(ns, serverName, target) {
	ns.print("Determining script to run...");
	let hackWeakenGrow = await ServerAnalyzer.shouldHackWeakenGrow(ns, target);
	ns.print(hackWeakenGrow.name);
	if (hackWeakenGrow == ServerAnalyzer.HackWeakenGrow.Weaken) {
		await runVirusScriptAsync(ns, serverName, weakenScriptName, target);
	} else if (hackWeakenGrow == ServerAnalyzer.HackWeakenGrow.Grow) {
		await runVirusScriptAsync(ns, serverName, growScriptName, target);
	} else {
		await runVirusScriptAsync(ns, serverName, hackScriptName, target);
	}
}

export async function runVirusScriptAsync(ns, serverName, scriptName, targetServer) {
	ns.scriptKill(hackScriptName, serverName);
	ns.scriptKill(weakenScriptName, serverName);
	ns.scriptKill(growScriptName, serverName);
	let serverRam = ns.getServerRam(serverName);
	let serverAvailableRam = serverRam[0] - serverRam[1];
	let scriptRamCost = ns.getScriptRam(scriptName);
	let maximumThreads = Math.floor(serverAvailableRam / scriptRamCost);
	if (maximumThreads != 0) {
		ns.print("Running " + scriptName + " on " + serverName + " targeting " + targetServer + " with " + maximumThreads + " threads");
		ns.exec(scriptName, serverName, maximumThreads, targetServer, serverName, listenPort);
	}
}

export async function nukeServersAsync(ns, distributedAttackTargetServer) {
	handledServers = [ns.getHostname(), 'home'];
	var serversToScan = await serversScanAsync(ns, distributedAttackTargetServer);
	for (var i = 0; i < serversToScan.length; i++) {
		var serverName = serversToScan[i];

		//Do whatever we need for this server;
		if (await compromiseAndNukeServerAsync(ns, serverName)) {
			//deploy all required scripts
			for (let p = 0; p < scriptsToDeploy.length; p++) {
				let scriptToDeploy = scriptsToDeploy[p];
				await deployScripts.deployFileToServerAsync(ns, scriptToDeploy, serverName);
			}

			//run a script
			await spawnVirusAsync(ns, serverName, distributedAttackTargetServer)
		}
		handledServers.push(serverName);
	}
}

async function compromiseAndNukeServerAsync(ns, serverName) {
	if (ns.hasRootAccess(serverName)) {
		return true;
	}
	ns.print("Compromising and Nuking " + serverName);
	if (ns.getServerRequiredHackingLevel(serverName) > ns.getHackingLevel()) {
		ns.print("Required hacking level too high");
		return false;
	}
	var numPortsToHack = ns.getServerNumPortsRequired(serverName);
	if (numPortsToHack > 0) {
		ns.brutessh(serverName);
	}
	if (numPortsToHack > 1) {
		ns.ftpcrack(serverName)
	}
	if (numPortsToHack > 2) {
		ns.relaysmtp(serverName)
	}
	if (numPortsToHack > 3) {
		ns.httpworm(serverName)
	}
	if (numPortsToHack > 4) {
		ns.print("Unable to open more than 4 ports");
		return false; //currently unable to open more than 4 ports
	}
	ns.nuke(serverName);
	ns.print("Successfully nuked " + serverName);
	return true;
}

export async function serversScanAsync(ns, target) {
	var playerServers = ['home', 'Server1'];
	var serverChecked = [];
	var checkList = [];
	ns.print(target);
	var servers1 = await ns.scan(target);
	for (var server in servers1) {
		if (!checkList.includes(servers1[server])) {
			checkList.push(servers1[server]);
		}
	}
	serverChecked.push(target);
	var flag = true;
	while (flag) {
		flag = false;
		for (var i = 0; i < checkList.length; i++) {
			ns.print("checklist " + checkList);
			var servers = await ns.scan(checkList[i]);
			if (!serverChecked.includes(checkList[i])) {
				serverChecked.push(checkList[i]);
			}
			for (var server in servers) {
				if (!checkList.includes(servers[server])) {
					checkList.push(servers[server]);
				}
			}
		}
	}
	// remove player servers from serverChecked
	for (var server in playerServers) {
		for (var i = 0; i < serverChecked.length; i++) {
			if (serverChecked == playerServers[server]) {
				serverChecked.splice(i, 1);
				i--;
			}
		}
	}
	return serverChecked;
}