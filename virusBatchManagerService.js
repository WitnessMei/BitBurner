//TODO handle callbacks
//TODO decide what deploys all initial batches

import * as batchHelper from "/BitBurner/virusBatchHelper.js";

export const intraBatchSeperationMs = 25;
export const interBatchSeperationMs = 125;
export const hackSecurityIncrease = 0.002;
export const growSecurityIncrease = 0.004;
export const weakenSecurityDecrease = 0.005;

export const weakenScriptName = "/BitBurner/virusWeaken.js";
export const hackScriptName = "/BitBurner/virusHack.js";
export const growScriptName = "/BitBurner/virusGrow.js";
export const callbackScriptName = "/BitBurner/virusBatchCallback.js";

export const batchManagerServiceListenPort = 2;

/** @param {NS} ns */
export async function main(ns) {
	ns.disableLog("ALL");
	//should this spawn batches on all servers too?
	//Or is another script doing that.
	await Listen();
}


export class BatchDetails {
	constructor(scriptServerName, batchId, batchExecutionDetails) {
		this.scriptServerName = scriptServerName;
		this.batchId = batchId;
		this.batchExecutionDetails = batchExecutionDetails;
	}
}

export async function ListenForBatches(ns) {
	ns.print("Listening for BATCH messages...");
	while (true) {
		var message = await ns.readPort(batchManagerServiceListenPort);
		if (message != "NULL PORT DATA" && message != null && message != "") {
			let serverStatusReportMessage = JSON.parse(message);
			//ns.print("Recieved message " + message);
			let serverName = serverStatusReportMessage.serverName;
			let lastTarget = serverStatusReportMessage.lastTargetServer;
			let batchId = serverStatusReportMessage.batchId;

			// not tracking batches yet
			// const isBatchId = (element) => element.batchId == batchId;
			// var batchIndex = trackedBatches.findIndex(isBatchId);
			// //var batchExecutionDetails = trackedBatches[batchIndex].batchExecutionDetails;
			// trackedBatches.splice(batchIndex, 1);

			var targetMoneyThreshold = ns.getServerMaxMoney(lastTarget) * 0.98;
			var targetCurrMoney = ns.getServerMoneyAvailable(lastTarget);
			var serverMinSec = ns.getServerMinSecurityLevel(lastTarget);
			var serverCurrSec = ns.getServerSecurityLevel(lastTarget);

			//Always hack grow batch unless we need to recover to optimal values
			if (serverCurrSec > serverMinSec + 1){
				ns.print("Weakening...");
				await startWeakenBatchOnServer(ns, lastTarget, serverName);
			}
			else if(targetCurrMoney < targetMoneyThreshold){
				ns.print("Growing...");
				await StartGrowBatchOnServer(ns, lastTarget, serverName);
			}
			else{
				ns.print("Hacking...");
				await startHackGrowBatchOnServer(ns, lastTarget, serverName);
			}
		}
		await ns.sleep(interBatchSeperationMs);
	}
}

export async function startHackGrowBatchesOnServer(ns, targetServerName, scriptServerName) {
	while (await startHackGrowBatchOnServer(ns, targetServerName, scriptServerName)) {
		await ns.sleep(interBatchSeperationMs)
	}
}

export async function startHackGrowBatchOnServer(ns, targetServerName, scriptServerName) {
	var batchId = crypto.randomUUID();
	var availableRam = ns.getServerMaxRam(scriptServerName) - ns.getServerUsedRam(scriptServerName);
	var executionDetails = await GetHackGrowBatchExecutionDetailsWithMaxRamAsync(ns, targetServerName, availableRam);
	if (executionDetails.batchRamCost == 0) {
		return false;
	}
	var hackTime = ns.getHackTime(targetServerName);
	var weakenTime = ns.getWeakenTime(targetServerName);
	var growTime = ns.getGrowTime(targetServerName);

	var hackDelay = weakenTime - hackTime;
	var firstWeakenDelay = intraBatchSeperationMs;
	var growDelay = (2 * intraBatchSeperationMs) + (weakenTime - growTime);
	var secondWeakenDelay = (3 * intraBatchSeperationMs);
	var callbackDelay = weakenTime + (4 * intraBatchSeperationMs);

	//Deploy and run scripts with delays to complete the batch attack.
	//Run one callback script to alert BatchManagerService when the batch is complete.
	// ns.print("BATCH " + batchId + " on " + scriptServerName + ":");
	// ns.print("Target " + targetServerName);
	await spawnVirusScriptAsync(ns, scriptServerName, hackScriptName, targetServerName, executionDetails.numHackThreads, hackDelay, batchId, "hack", 1);
	await spawnVirusScriptAsync(ns, scriptServerName, weakenScriptName, targetServerName, executionDetails.numWeakenResetHackThreads, firstWeakenDelay, batchId, "hack", 2);
	await spawnVirusScriptAsync(ns, scriptServerName, growScriptName, targetServerName, executionDetails.numGrowThreads, growDelay, batchId, "hack", 3);
	await spawnVirusScriptAsync(ns, scriptServerName, weakenScriptName, targetServerName, executionDetails.numWeakenResetGrowThreads, secondWeakenDelay, batchId, "hack", 4);
	await spawnVirusScriptAsync(ns, scriptServerName, callbackScriptName, targetServerName, 1, callbackDelay, batchId, "hack", 5);

	return true;

	// var batchTrackingDetails = new BatchDetails(scriptServerName, batchId, executionDetails);
	// trackedBatches.push(batchTrackingDetails);
}

export async function startGrowBatchesOnServer(ns, targetServerName, scriptServerName) {
	while (await StartGrowBatchOnServer(ns, targetServerName, scriptServerName)) {
		await ns.sleep(interBatchSeperationMs)
	}
}

export async function StartGrowBatchOnServer(ns, targetServerName, scriptServerName) {
	var batchId = crypto.randomUUID();
	var availableRam = ns.getServerMaxRam(scriptServerName) - ns.getServerUsedRam(scriptServerName);
	let executionDetails = await GetGrowBatchExecutionDetailsWithMaxRamAsync(ns, targetServerName, availableRam);
	if (executionDetails.batchRamCost == 0) {
		return false;
	}
	var weakenTime = ns.getWeakenTime(targetServerName);
	var growTime = ns.getGrowTime(targetServerName);

	var growDelay = (weakenTime - growTime);
	var secondWeakenDelay = intraBatchSeperationMs;
	var callbackDelay = weakenTime + (2 * intraBatchSeperationMs);

	//Deploy and run scripts with delays to complete the batch attack.
	//Run one callback script to alert BatchManagerService when the batch is complete.
	// ns.print("BATCH " + batchId + " on " + scriptServerName + ":");
	// ns.print("Target " + targetServerName);
	await spawnVirusScriptAsync(ns, scriptServerName, growScriptName, targetServerName, executionDetails.numGrowThreads, growDelay, batchId, "grow", 1);
	await spawnVirusScriptAsync(ns, scriptServerName, weakenScriptName, targetServerName, executionDetails.numWeakenResetGrowThreads, secondWeakenDelay, batchId, "grow", 2);
	await spawnVirusScriptAsync(ns, scriptServerName, callbackScriptName, targetServerName, 1, callbackDelay, batchId, "grow", 3);

	// var batchTrackingDetails = new BatchDetails(scriptServerName, batchId, executionDetails);
	// trackedBatches.push(batchTrackingDetails);
	return true;
}

export async function startWeakenBatchOnServer(ns, targetServerName, scriptServerName) {
	var batchId = crypto.randomUUID();
	var availableRam = ns.getServerMaxRam(scriptServerName) - ns.getServerUsedRam(scriptServerName);
	let executionDetails = await batchHelper.GetWeakenBatchExecutionDetailsAsync(ns, targetServerName, availableRam);
	if (executionDetails.batchRamCost == 0) {
		return false;
	}
	//our "weaken" grows the server a bit anyway but just weakens over time as well.
	var weakenTime = ns.getWeakenTime(targetServerName);
	var secondWeakenDelay = 0;
	var callbackDelay = weakenTime + intraBatchSeperationMs;

	//Deploy and run scripts with delays to complete the batch attack.
	//Run one callback script to alert BatchManagerService when the batch is complete.
	// ns.print("BATCH " + batchId + " on " + scriptServerName + ":");
	// ns.print("Target " + targetServerName);
	await spawnVirusScriptAsync(ns, scriptServerName, weakenScriptName, targetServerName, executionDetails.numWeakenResetGrowThreads, secondWeakenDelay, batchId, "weaken", 1);
	await spawnVirusScriptAsync(ns, scriptServerName, callbackScriptName, targetServerName, 1, callbackDelay, batchId, "weaken", 2);

	// var batchTrackingDetails = new BatchDetails(scriptServerName, batchId, executionDetails);
	// trackedBatches.push(batchTrackingDetails);
	return true;
}

export async function runMaxCapacityVirusScriptAsync(ns, serverName, scriptName, targetServer) {
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

async function spawnVirusScriptAsync(ns, serverName, scriptName, targetServer, numThreads, msDelay, batchId, batchType, step) {
	//ns.print("Running " + scriptName + " with " + numThreads + " threads.");
	ns.exec(scriptName, serverName, numThreads, targetServer, serverName, batchManagerServiceListenPort, msDelay, batchId, batchType, step);
}

async function GetHackGrowBatchExecutionDetailsWithMaxRamAsync(ns, targetServerName, scriptServerMaxRam) {
	let validBatch = false;
	let factorToSiphon = 0.50;
	while (!validBatch && factorToSiphon > 0) {
		let batchDetails = await batchHelper.GetHackGrowBatchExecutionDetailsAsync(ns, targetServerName, factorToSiphon);
		if (batchDetails.batchRamCost > scriptServerMaxRam) {
			factorToSiphon = factorToSiphon - 0.0001;
		}
		else {
			return batchDetails;
		}
	}
	return new batchHelper.BatchExecutionDetails(0, 0, 0, 0, 0, 0, 0, 0, targetServerName);
}

async function GetGrowBatchExecutionDetailsWithMaxRamAsync(ns, targetServerName, scriptServerMaxRam) {
	return batchHelper.GetGrowBatchExecutionDetailsAsync(ns, targetServerName, scriptServerMaxRam);
}