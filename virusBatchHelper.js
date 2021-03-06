export const hackSecurityIncrease = 0.002;
export const growSecurityIncrease = 0.004;
export const weakenSecurityDecrease = 0.005;

export const batchCallbackScriptName = "/BitBurner/virusBatchCallback.js";
export const weakenScriptName = "/BitBurner/virusWeaken.js";
export const hackScriptName = "/BitBurner/virusHack.js";
export const growScriptName = "/BitBurner/virusGrow.js";

export class BatchExecutionDetails {
	constructor(numHackThreads, numGrowThreads, numWeakenResetHackThreads, numWeakenResetGrowThreads, weakenRamCost, hackRamCost, growRamCost, callbackRam, targetServer) {
		this.numHackThreads = numHackThreads;
		this.numGrowThreads = numGrowThreads;
		this.numWeakenResetHackThreads = numWeakenResetHackThreads;
		this.numWeakenResetGrowThreads = numWeakenResetGrowThreads;
		this.weakenRamCost = weakenRamCost;
		this.hackRamCost = hackRamCost;
		this.growRamCost = growRamCost;
		this.batchRamCost = (weakenRamCost * numWeakenResetGrowThreads) + (weakenRamCost * numWeakenResetHackThreads) + (hackRamCost * numHackThreads) + (growRamCost * numGrowThreads) + callbackRam;
		this.targetServer = targetServer;
	}
}

export async function GetHackGrowBatchExecutionDetailsAsync(ns, targetServerName, factorToSiphon) {
	var weakenRam = ns.getScriptRam(weakenScriptName);
	var hackRam = ns.getScriptRam(hackScriptName);
	var growRam = ns.getScriptRam(growScriptName);
	var callbackRam = ns.getScriptRam(batchCallbackScriptName);

	var targetMaxMoney = ns.getServerMaxMoney(targetServerName);
	var targetCurrMoney = ns.getServerMoneyAvailable(targetServerName);
	var serverMinSec = ns.getServerMinSecurityLevel(targetServerName);
	var serverCurrSec = ns.getServerSecurityLevel(targetServerName);

	var moneyToAcquire = targetCurrMoney * factorToSiphon;
	var moneyAcquiredPerHack = (targetCurrMoney * ns.hackAnalyze(targetServerName));
	var hackThreadsRequired = Math.ceil(moneyToAcquire / moneyAcquiredPerHack);
	if(hackThreadsRequired < 1){
		await ns.print("NOT GOOD NO SIR");
		hackThreadsRequired = 1
	}
	var totalMoneyAcquired = moneyAcquiredPerHack * hackThreadsRequired;

	var weakenThreadsToResetHack = DetermineNumWeakenThreadsCounterHack(ns, hackThreadsRequired);

	var growFactorNeededToReset = targetCurrMoney / (targetCurrMoney - totalMoneyAcquired);
	if(growFactorNeededToReset < 1){
		growFactorNeededToReset = 1;
	}
	var growThreadsRequired = Math.ceil(ns.growthAnalyze(targetServerName, growFactorNeededToReset));

	var weakenThreadsToResetGrow = DetermineNumWeakenThreadsCounterGrow(ns, growThreadsRequired);

	return new BatchExecutionDetails(hackThreadsRequired, growThreadsRequired, weakenThreadsToResetHack, weakenThreadsToResetGrow, weakenRam, hackRam, growRam, callbackRam, targetServerName);
}

export async function GetGrowBatchExecutionDetailsAsync(ns, targetServerName, maxRam) {
	var weakenRam = ns.getScriptRam(weakenScriptName, ns.getHostname());
	var growRam = ns.getScriptRam(growScriptName, ns.getHostname());
	var callbackRam = ns.getScriptRam(batchCallbackScriptName, ns.getHostname());

	var targetMaxMoney = ns.getServerMaxMoney(targetServerName);
	var targetCurrMoney = ns.getServerMoneyAvailable(targetServerName);

	if(maxRam < (weakenRam + callbackRam + growRam)){
		return new BatchExecutionDetails(0, 0, 0, 0, 0, 0, 0, 0, targetServerName); 
	}
	var ramUnit = (maxRam - callbackRam)/9.0;
	var maxRamForGrow = ramUnit * 5.0;

	var growFactorNeededToReset = targetMaxMoney / targetCurrMoney;
	var totalGrowThreadsRequired = Math.ceil(ns.growthAnalyze(targetServerName, growFactorNeededToReset));
	var maxPossibleGrowThreads = Math.floor(maxRamForGrow/growRam);
	if(totalGrowThreadsRequired <= 0){
		return new BatchExecutionDetails(0, 0, 0, 0, 0, 0, 0, 0, targetServerName); 
	}

	var growThreadsRequired = 0;
	if(totalGrowThreadsRequired > maxPossibleGrowThreads){
		growThreadsRequired = maxPossibleGrowThreads;
	} else {
		growThreadsRequired = totalGrowThreadsRequired;
	}

	var weakenThreadsToResetGrow = DetermineNumWeakenThreadsCounterGrow(ns, growThreadsRequired);

	return new BatchExecutionDetails(0, growThreadsRequired, 0, weakenThreadsToResetGrow, weakenRam, 0, growRam, callbackRam, targetServerName);
}

export async function GetWeakenBatchExecutionDetailsAsync(ns, targetServerName, maxRam) {
	var weakenRam = ns.getScriptRam(weakenScriptName, ns.getHostname());
	var growRam = ns.getScriptRam(growScriptName, ns.getHostname());
	var callbackRam = ns.getScriptRam(batchCallbackScriptName, ns.getHostname());

	if(maxRam < (weakenRam + callbackRam + growRam)){
		return new BatchExecutionDetails(0, 0, 0, 0, 0, 0, 0, 0, targetServerName); 
	}

	var maxRamForWeaken = maxRam - callbackRam;
	
	var ramUnit = (maxRam - callbackRam)/9.0;
	var maxPossibleWeakenThreads = Math.floor(maxRamForWeaken/growRam);
	if(maxPossibleWeakenThreads <= 0){
		return new BatchExecutionDetails(0, 0, 0, 0, 0, 0, 0, 0, targetServerName); 
	}

	return new BatchExecutionDetails(0, 0, 0, maxPossibleWeakenThreads, weakenRam, 0, 0, callbackRam, targetServerName);
}

function DetermineNumWeakenThreadsCounterGrow(ns, numGrowThreads) {
	var totalSecIncrease = ns.growthAnalyzeSecurity(numGrowThreads);
	return DetermineNumWeakenThreadsCounterSecIncrease(totalSecIncrease);
}

function DetermineNumWeakenThreadsCounterHack(ns, numHackThreads) {
	var totalSecIncrease = ns.hackAnalyzeSecurity(numHackThreads);
	return DetermineNumWeakenThreadsCounterSecIncrease(totalSecIncrease);
}

function DetermineNumWeakenThreadsCounterSecIncrease(secIncrease) {
	var numWeakenThreadsCounter = Math.ceil(secIncrease / weakenSecurityDecrease);
	return numWeakenThreadsCounter;
}