export const hackSecurityIncrease = 0.002;
export const growSecurityIncrease = 0.004;
export const weakenSecurityDecrease = 0.005;

export const weakenScriptName = "virusWeaken.js";
export const hackScriptName = "virusHack.js";
export const growScriptName = "virusGrow.js";

export class BatchExecutionDetails {
	constructor(numHackThreads, numGrowThreads, numWeakenResetHackThreads, numWeakenResetGrowThreads, weakenRamCost, hackRamCost, growRamCost, targetServer) {
		this.numHackThreads = numHackThreads;
		this.numGrowThreads = numGrowThreads;
		this.numWeakenResetHackThreads = numWeakenResetHackThreads;
		this.numWeakenResetGrowThreads = numWeakenResetGrowThreads;
		this.weakenRamCost = weakenRamCost;
		this.hackRamCost = hackRamCost;
		this.growRamCost = growRamCost;
		this.batchRamCost = (weakenRamCost * numWeakenResetGrowThreads) + (weakenRamCost * numWeakenResetHackThreads) + (hackRamCost * numHackThreads) + (growRamCost * numGrowThreads);
		this.targetServer = targetServer;
	}
}

export async function GetBatchExecutionDetailsAsync(ns, targetServerName, factorToSiphon) {
	var weakenRam = ns.getScriptRam(weakenScriptName, "home");
	var hackRam = ns.getScriptRam(hackScriptName, "home");
	var growRam = ns.getScriptRam(growScriptName, "home");
	var thing = ns.getScriptRam("BitBurner/" + weakenScriptName);

	ns.print("ramcalcs");
	ns.print(weakenRam);
	ns.print(thing);

	var targetMaxMoney = ns.getServerMaxMoney(targetServerName);
	var targetCurrMoney = ns.getServerMoneyAvailable(targetServerName);
	var serverMinSec = ns.getServerMinSecurityLevel(targetServerName);
	var serverCurrSec = ns.getServerSecurityLevel(targetServerName);

	var moneyToAcquire = targetCurrMoney * factorToSiphon;
	var moneyAcquiredPerHack = (targetCurrMoney * ns.hackAnalyze(targetServerName));
	var hackThreadsRequired = Math.ceil(moneyToAcquire / moneyAcquiredPerHack);
	var totalMoneyAcquired = moneyAcquiredPerHack * hackThreadsRequired;

	var weakenThreadsToResetHack = DetermineNumWeakenThreadsCounterHack(ns, hackThreadsRequired);

	var growFactorNeededToReset = targetCurrMoney / (targetCurrMoney - totalMoneyAcquired);
	var growThreadsRequired = Math.ceil(ns.growthAnalyze(targetServerName, growFactorNeededToReset));

	var weakenThreadsToResetGrow = DetermineNumWeakenThreadsCounterGrow(ns, growThreadsRequired);

	return new BatchExecutionDetails(hackThreadsRequired, growThreadsRequired, weakenThreadsToResetHack, weakenThreadsToResetGrow, weakenRam, hackRam, growRam, targetServerName);
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