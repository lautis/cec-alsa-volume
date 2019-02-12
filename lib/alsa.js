const execa = require("execa");

const limitsPattern = /Limits: Playback ([-\d]+) - ([-\d]+)/i;
const volumePattern = /[\w ]*: Playback ([-\d]+) \[[0-9]+%\] (?:[[0-9.-]+dB\] )?\[(on|off)\]/i;

const parseInfo = data => {
  const limits = limitsPattern.exec(data);
  const result = volumePattern.exec(data);

  if (result === null || limits === null) {
    throw new Error("Alsa Mixer Error: failed to parse output");
  }

  const min = parseFloat(limits[1]);
  const max = parseFloat(limits[2]);
  const volume = parseFloat(result[1]);

  return {
    volume: 100 * ((volume - min) / (max - min)),
    mute: result[2] === "off"
  };
};

class AlsaCtl {
  constructor(device, control) {
    this.device = device;
    this.control = control;
  }

  async amixer(...args) {
    return await execa.stdout("amixer", ["-D", this.device, ...args], {
      preferLocal: false
    });
  }

  async volume() {
    return await this.audioStatus().volume;
  }

  async volumeUp() {
    await this.amixer("set", this.control, "1%+");
    return await this.audioStatus().volume;
  }

  async volumeDown() {
    await this.amixer("set", this.control, "1%-");
    return await this.audioStatus().volume;
  }

  async toggleMute() {
    const { volume, mute } = await this.audioStatus();
    this.setMute(!mute);
    if (mute) {
      return volume;
    } else {
      return true;
    }
  }

  async setMute(value) {
    await this.amixer("set", this.control, value ? "mute" : "unmute").then(
      () => undefined
    );
  }

  async audioStatus() {
    const { volume, mute } = parseInfo(await this.amixer("get", this.control));
    return [mute, volume];
  }
}

module.exports = {
  parseInfo,
  AlsaCtl
};
