const execa = require("execa");

const reInfo = /[a-z][a-z ]*: Playback [0-9-]+ \[([0-9]+)%\] (?:[[0-9.-]+dB\] )?\[(on|off)\]/i;

const parseInfo = data => {
  const result = reInfo.exec(data);

  if (result === null) {
    throw new Error("Alsa Mixer Error: failed to parse output");
  }

  return {
    volume: parseInt(result[1], 10),
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
  AlsaCtl
};
