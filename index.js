#!/usr/bin/env node

const { CEC, CECMonitor } = require("@senzil/cec-monitor");
const { AlsaCtl } = require("./lib/alsa");
const { volumeSync } = require("./lib/monitor");
const { conversions } = require("./lib/conversions");
const parse = require("yargs-parser");

const args = parse(process.argv.slice(2), {
  default: {
    name: "CEC/ALSA Volume",
    "mixer-device": "hw:0",
    "mixer-name": "PCM",
    "min-volume": 0,
    "max-volume": 100
  }
});
const minVolume = Number(args["min-volume"]);
const maxVolume = Number(args["max-volume"]);

const receiver = new AlsaCtl(args["mixer-device"], args["mixer-name"]);
volumeSync("RapberryPi", receiver, conversions(minVolume, maxVolume));
