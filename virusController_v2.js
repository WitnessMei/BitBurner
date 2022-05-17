/** @param {NS} ns */
//import { deployFileToServer, getNewServersToScan } from "deployScript.js";
import * as batchManager from "/BitBurner/virusBatchManagerService.js";
import * as deployScripts from "/BitBurner/deployScript.js";
import * as Messaging from "/BitBurner/virusMessaging.js";
import * as ServerAnalyzer from "/BitBurner/virusServerAnalyzer";

var listenPort = 1;
var handledServers = [];
var weakenScriptName = "/BitBurner/virusWeaken.js";
var hackScriptName = "/BitBurner/virusHack.js";
var growScriptName = "/BitBurner/virusGrow.js"
var scriptsToDeploy = ["/BitBurner/virusMessaging.js", "/BitBurner/virusHack.js", "/BitBurner/virusWeaken.js", "/BitBurner/virusGrow.js", "/BitBurner/virusBatchCallback.js"];
export async function main(ns) {
	var distributedAttackTargetServer = ns.args[0];
	var attackType = ns.args[1];
	if (distributedAttackTargetServer == null || distributedAttackTargetServer == "") {
		distributedAttackTargetServer = ns.getHostname();
	}
	ns.disableLog("ALL");
	await nukeServersAsync(ns, distributedAttackTargetServer, attackType);
	await listenForScriptUpdatesAsync(ns);
}

export async function listenForScriptUpdatesAsync(ns) {
	ns.print("Listening for messages...");
	await batchManager.ListenForBatches(ns);
	// while (true) {
	// 	// var message = await ns.readPort(1);
	// 	// if (message != "NULL PORT DATA" && message != null && message != "") {
	// 	// 	let serverStatusReportMessage = JSON.parse(message);
	// 	// 	ns.print("Recieved message " + message);
	// 	// 	let serverName = serverStatusReportMessage.serverName;
	// 	// 	let lastTarget = serverStatusReportMessage.lastTargetServer;
	// 	// 	if (!(message.serverName == ns.getHostname())) {
	// 	// 		await spawnVirusAsync(ns, serverName, lastTarget);
	// 	// 	}
	// 	// }
	// 	// await ns.sleep(250);
	// }
}

export async function spawnVirusAsync(ns, serverName, target, attackType) {
	if (attackType == "grow") {
		await batchManager.startGrowBatchesOnServer(ns, target, serverName);
	} else if (attackType == "hack") {
		await batchManager.startHackGrowBatchesOnServer(ns, target, serverName)
	}
	else {
		await ns.tprint("Unrecognized attack type!");
	}

	// ns.print("Determining script to run...");
	// let hackWeakenGrow = await ServerAnalyzer.shouldHackWeakenGrow(ns, target);
	// ns.print(hackWeakenGrow.name);
	// if (hackWeakenGrow == ServerAnalyzer.HackWeakenGrow.Weaken) {
	// 	await runVirusScriptAsync(ns, serverName, weakenScriptName, target);
	// } else if (hackWeakenGrow == ServerAnalyzer.HackWeakenGrow.Grow) {
	// 	await runVirusScriptAsync(ns, serverName, growScriptName, target);
	// } else {
	// 	await runVirusScriptAsync(ns, serverName, hackScriptName, target);
	// }
	await ns.sleep(10);
}

export async function runVirusScriptAsync(ns, serverName, scriptName, targetServer) {
	if (ns.getServerRequiredHackingLevel(targetServer) > ns.getHackingLevel()) {
		ns.print("Required hacking level too high");
		return;
	}
	ns.scriptKill(hackScriptName, serverName);
	ns.scriptKill(weakenScriptName, serverName);
	ns.scriptKill(growScriptName, serverName);
	let serverRam = ns.getServerRam(serverName);
	let serverAvailableRam = serverRam[0] - serverRam[1];
	let scriptRamCost = ns.getScriptRam(scriptName);
	let maximumThreads = Math.floor(serverAvailableRam / scriptRamCost);
	if (maximumThreads != 0) {
		//ns.print("Running " + scriptName + " on " + serverName + " targeting " + targetServer + " with " + maximumThreads + " threads");
		ns.exec(scriptName, serverName, maximumThreads, targetServer, serverName, listenPort);
	}
}

export async function nukeServersAsync(ns, distributedAttackTargetServer, attackType) {
	handledServers = [ns.getHostname(), 'home'];
	var serversToScan = await serversScanAsync(ns, distributedAttackTargetServer);
	for (var i = 0; i < serversToScan.length; i++) {
		var serverName = serversToScan[i];

		//Do whatever we need for this server;
		if (await compromiseAndNukeServerAsync(ns, serverName)) {
			//deploy all required scripts
			for (let p = 0; p < scriptsToDeploy.length; p++) {
				let scriptToDeploy = scriptsToDeploy[p];
				//ns.enableLog("ALL");
				await deployScripts.deployFileToServerAsync(ns, scriptToDeploy, serverName);
				ns.disableLog("ALL");
			}

			//run a script
			ns.print("SPAWNING BATCH FOR " + serverName);
			await spawnVirusAsync(ns, serverName, distributedAttackTargetServer, attackType)
		}
		handledServers.push(serverName);
	}
}

async function compromiseAndNukeServerAsync(ns, serverName) {
	if (ns.hasRootAccess(serverName)) {
		return true;
	}
	ns.print("Compromising and Nuking " + serverName);
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