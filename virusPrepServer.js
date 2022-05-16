/** @param {NS} ns */
import * as batchManager from "/BitBurner/virusBatchManagerService.js";

export async function main(ns) {
	await batchManager.startGrowBatchesOnServer(ns, ns.args[0], ns.args[1]);
}