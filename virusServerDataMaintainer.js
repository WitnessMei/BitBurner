export class ServerData {
  constructor(serverName, serverMaxRam, serverUsedRam, nuked, ssh, ftp, smtp, http, sql, maxMoney, curMoney, maxSec, currSec, requiredHackingLevel, requiredPorts) {
    this.serverName = serverName;
    this.serverRam = new ServerRam(serverMaxRam, serverUsedRam);
    this.ports = new Ports(ssh, ftp, smtp, http, sql);
    this.nuked = nuked;
    this.maxMoney = maxMoney;
    this.curMoney = curMoney;
    this.maxSec = maxSec;
    this.currSec = currSec;
    this.requiredHackingLevel = requiredHackingLevel;
    this.requiredPorts = requiredPorts;
  }
}

export class ServerRam {
	constructor(serverMaxRam, serverUsedRam) {
    this.serverMaxRam = serverMaxRam;
	this.serverUsedRam = serverUsedRam;
	this.serverAvailableRam = serverMaxRam - serverUsedRam;
  }
}

export class Ports {
	constructor(ssh, ftp, smtp, http, sql) {
    this.ssh = ssh;
	  this.ftp = ftp;
	  this.smtp = smtp;
    this.smtp = http;
    this.smtp = sql;
  }
}