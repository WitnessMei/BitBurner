//TODO handle callbacks
//TODO decide what deploys all initial batches

import * as batchHelper from "/BitBurner/virusBatchHelper.js";

export const intraBatchSeperationMs = 1000;
export const interBatchSeperationMs = 3000;
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
			ns.print("Recieved message " + message);
			let serverName = serverStatusReportMessage.serverName;
			let lastTarget = serverStatusReportMessage.lastTargetServer;
			let batchId = serverStatusReportMessage.batchId;

			// not tracking batches yet
			// const isBatchId = (element) => element.batchId == batchId;
			// var batchIndex = trackedBatches.findIndex(isBatchId);
			// //var batchExecutionDetails = trackedBatches[batchIndex].batchExecutionDetails;
			// trackedBatches.splice(batchIndex, 1);

			await startHackGrowBatchOnServer(ns, lastTarget, serverName);
		}
		await ns.sleep(250);
	}
}

export async function startHackGrowBatchesOnServer(ns, targetServerName, scriptServerName) {
	while (await startHackGrowBatchOnServer(ns, targetServerName, scriptServerName)) {
		await ns.sleep(100)
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
	ns.print("BATCH " + batchId + " on " + scriptServerName + ":");
	ns.print("Target " + targetServerName);
	await spawnVirusScriptAsync(ns, scriptServerName, hackScriptName, targetServerName, executionDetails.numHackThreads, hackDelay, batchId, 1);
	await spawnVirusScriptAsync(ns, scriptServerName, weakenScriptName, targetServerName, executionDetails.numWeakenResetHackThreads, firstWeakenDelay, batchId, 2);
	await spawnVirusScriptAsync(ns, scriptServerName, growScriptName, targetServerName, executionDetails.numGrowThreads, growDelay, batchId, 3);
	await spawnVirusScriptAsync(ns, scriptServerName, weakenScriptName, targetServerName, executionDetails.numWeakenResetGrowThreads, secondWeakenDelay, batchId, 4);
	await spawnVirusScriptAsync(ns, scriptServerName, callbackScriptName, targetServerName, 1, callbackDelay, batchId, 5);

	return true;

	// var batchTrackingDetails = new BatchDetails(scriptServerName, batchId, executionDetails);
	// trackedBatches.push(batchTrackingDetails);
}

export async function StartGrowBatchOnServer(ns, targetServerName, scriptServerName) {
	var batchId = crypto.randomUUID();
	var availableRam = ns.getServerMaxRam(scriptServerName) - ns.getServerUsedRam(scriptServerName);
	let executionDetails = await GetGrowBatchExecutionDetailsWithMaxRamAsync(ns, targetServerName, availableRam);
	if (executionDetails.batchRamCost == 0) {
		return;
	}
	var weakenTime = ns.getWeakenTime(targetServerName);
	var growTime = ns.getGrowTime(targetServerName);

	var growDelay = (weakenTime - growTime);
	var secondWeakenDelay = intraBatchSeperationMs;
	var callbackDelay = weakenTime + (2 * intraBatchSeperationMs);

	//Deploy and run scripts with delays to complete the batch attack.
	//Run one callback script to alert BatchManagerService when the batch is complete.
	ns.print("BATCH " + batchId + " on " + scriptServerName + ":");
	ns.print("Target " + targetServerName);
	await spawnVirusScriptAsync(ns, scriptServerName, growScriptName, targetServerName, executionDetails.numGrowThreads, growDelay, batchId, 1);
	await spawnVirusScriptAsync(ns, scriptServerName, weakenScriptName, targetServerName, executionDetails.numWeakenResetGrowThreads, secondWeakenDelay, batchId, 2);
	await spawnVirusScriptAsync(ns, scriptServerName, callbackScriptName, targetServerName, 1, callbackDelay, batchId, 3);

	// var batchTrackingDetails = new BatchDetails(scriptServerName, batchId, executionDetails);
	// trackedBatches.push(batchTrackingDetails);
}

async function spawnVirusScriptAsync(ns, serverName, scriptName, targetServer, numThreads, msDelay, batchId, step) {
	ns.print("Running " + scriptName + " with " + numThreads + " threads.");
	ns.exec(scriptName, serverName, numThreads, targetServer, serverName, batchManagerServiceListenPort, msDelay, batchId, step);
	await ns.sleep(5);
}

async function GetHackGrowBatchExecutionDetailsWithMaxRamAsync(ns, targetServerName, scriptServerMaxRam) {
	let validBatch = false;
	let factorToSiphon = 0.30;
	while (!validBatch && factorToSiphon > 0) {
		let batchDetails = await batchHelper.GetHackGrowBatchExecutionDetailsAsync(ns, targetServerName, factorToSiphon);
		if (batchDetails.batchRamCost > scriptServerMaxRam) {
			factorToSiphon = factorToSiphon - 0.001;
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