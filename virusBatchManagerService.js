//TODO handle callbacks
//TODO decide what deploys all initial batches

import * as batchHelper from "BitBurner/virusBatchHelper.js";

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

var trackedBatches = [];

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

async function Listen(){
	while(true){
		//check port for completed batches

		//call startBatchOnServer for new batch

		await ns.sleep(1000);
	}
}

export async function startHackGrowBatchOnServer(ns, targetServerName, scriptServerName) {
	var batchId = crypto.randomUUID();
	var availableRam = ns.getServerMaxRam(scriptServerName) - ns.getServerUsedRam(scriptServerName);
	var executionDetails = await GetHackGrowBatchExecutionDetailsWithMaxRamAsync(ns, targetServerName, availableRam);
	if(executionDetails.batchRamCost == 0){
		return;
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
	await spawnVirusScriptAsync(ns, scriptServerName, hackScriptName, targetServerName, executionDetails.numHackThreads, hackDelay, batchId, 1);
	await spawnVirusScriptAsync(ns, scriptServerName, weakenScriptName, targetServerName, executionDetails.numWeakenResetHackThreads, firstWeakenDelay, batchId, 2);
	await spawnVirusScriptAsync(ns, scriptServerName, growScriptName, targetServerName, executionDetails.numGrowThreads, growDelay, batchId, 3);
	await spawnVirusScriptAsync(ns, scriptServerName, weakenScriptName, targetServerName, executionDetails.numWeakenResetGrowThreads, secondWeakenDelay, batchId, 4);
	await spawnVirusScriptAsync(ns, scriptServerName, callbackScriptName, targetServerName, 1, callbackDelay, batchId, 5);

	var batchTrackingDetails = new BatchDetails(scriptServerName, batchId, executionDetails);
	trackedBatches.push(batchTrackingDetails);
}

export async function StartGrowBatchOnServer(ns, targetServerName, scriptServerName) {
	var batchId = crypto.randomUUID();
	var availableRam = ns.getServerMaxRam(scriptServerName) - ns.getServerUsedRam(scriptServerName);
	let executionDetails = await GetGrowBatchExecutionDetailsWithMaxRamAsync(ns, targetServerName, availableRam);
	if(executionDetails.batchRamCost == 0){
		return;
	}
	var weakenTime = ns.getWeakenTime(targetServerName);
	var growTime = ns.getGrowTime(targetServerName);

	var growDelay = (weakenTime - growTime);
	var secondWeakenDelay = intraBatchSeperationMs;
	var callbackDelay = weakenTime + (2 * intraBatchSeperationMs);

	//Deploy and run scripts with delays to complete the batch attack.
	//Run one callback script to alert BatchManagerService when the batch is complete.
	await spawnVirusScriptAsync(ns, scriptServerName, growScriptName, targetServerName, executionDetails.numGrowThreads, growDelay, batchId, 1);
	await spawnVirusScriptAsync(ns, scriptServerName, weakenScriptName, targetServerName, executionDetails.numWeakenResetGrowThreads, secondWeakenDelay, batchId, 2);
	await spawnVirusScriptAsync(ns, scriptServerName, callbackScriptName, targetServerName, 1, callbackDelay, batchId, 3);

	var batchTrackingDetails = new BatchDetails(scriptServerName, batchId, executionDetails);
	trackedBatches.push(batchTrackingDetails);
}

async function spawnVirusScriptAsync(ns, serverName, scriptName, targetServer, numThreads, msDelay, batchId, step) {
	ns.print("BATCH " + batchId + ": Running " + scriptName + " on " + serverName + " targeting " + targetServer + " with " + numThreads + " threads.");
	ns.exec(scriptName, serverName, numThreads, targetServer, serverName, batchManagerServiceListenPort, msDelay, batchId, step);
	await ns.sleep(5);
}

async function GetHackGrowBatchExecutionDetailsWithMaxRamAsync(ns, targetServerName, scriptServerMaxRam) {
	let validBatch = false;
	let factorToSiphon = 0.30;
	while (!validBatch) {
		let batchDetails = await batchHelper.GetHackGrowBatchExecutionDetailsAsync(ns, targetServerName, factorToSiphon);
		if (batchDetails.batchRamCost > scriptServerMaxRam) {
			factorToSiphon = factorToSiphon - 0.01;
		}
		else {
			return batchDetails;
		}
	}
}

async function GetGrowBatchExecutionDetailsWithMaxRamAsync(ns, targetServerName, scriptServerMaxRam) {
	return batchHelper.GetGrowBatchExecutionDetailsAsync(ns, targetServerName, scriptServerMaxRam);
}