const { CEC, CECMonitor } = require("@senzil/cec-monitor");
const { AlsaCtl } = require("./alsa");
const throttle = require("lodash.throttle");

const volumeSync = (name, receiver, cecVolume) => {
  const monitor = new CECMonitor(name, {
    com_port: "", //set com port to use (see cec-client -l)
    debug: false, // enable/disabled debug events from cec-client
    hdmiport: 1, // set inital hdmi port
    processManaged: false, // set/unset handlers to avoid unclear process exit.
    recorder: false, //enable cec-client as recorder device
    player: false, //enable cec-client as player device
    tuner: false, //enable cec-client as tuner device
    audio: true, //enable cec-client as audio system device
    auto_restart: true, //enable autrestart cec-client to avoid some wierd conditions
    no_serial: {
      //controls if the monitor restart cec-client when that stop after the usb was unplugged
      reconnect: false, //enable reconnection attempts when usb is unplugged
      wait_time: 30, //in seconds - time to do the attempt
      trigger_stop: false //false to avoid trigger stop event
    },
    cache: {
      enable: false, //treats the state like a cache, and enable _EXPIREDCACHE event.
      autorefresh: false, //enable the cache refresh (currently only power status), and enable _UPDATEDCACHE event.
      timeout: 30 //value greater than 0 (in seconds) enable cache invalidation timeout and request new values if autorefresh is enabled
    },
    command_timeout: 3, //An value greater than 0 (in secconds) meaning the timeout time for SendCommand function
    user_control_hold_interval: 1000 //An value greater than 0 (in miliseconds) meaning the interval for emit the special _USERCONTROLHOLD event
  });

  monitor.once(CECMonitor.EVENTS._STOP, async () => {
    console.log("STOP!!!");
  });

  const initAudio = async () => {
    monitor.SendMessage(
      null,
      CEC.LogicalAddress.TV,
      CEC.Opcode.REQUEST_ACTIVE_SOURCE
    );
    setTimeout(async () => {
      console.log("AUDIO START");
      monitor.SendMessage(
        null,
        CEC.LogicalAddress.TV,
        CEC.Opcode.SET_SYSTEM_AUDIO_MODE,
        CEC.SystemAudioStatus.ON
      );
      throttledReportAudioStatus();
    }, 10);
  };

  const reportAudioStatus = async (target = CEC.LogicalAddress.TV) => {
    const start = Date.now();
    const [muted, volume] = await receiver.audioStatus();
    monitor.SendMessage(
      null,
      CEC.LogicalAddress.TV,
      CEC.Opcode.REPORT_AUDIO_STATUS,
      cecVolume(muted, volume)
    );
  };

  const throttledReportAudioStatus = throttle(reportAudioStatus, 250, {
    leading: true,
    trailing: true
  });

  monitor.once(CECMonitor.EVENTS._READY, async () => {
    console.log(" -- READY -- ");
    monitor.SendMessage(
      null,
      CEC.LogicalAddress.TV,
      CEC.Opcode.GIVE_SYSTEM_AUDIO_MODE_STATUS
    );
    setTimeout(initAudio, 100);
  });

  monitor.on(CECMonitor.EVENTS.USER_CONTROL_PRESSED, async packet => {
    if (packet.data.val === CEC.UserControlCode.VOLUME_UP) {
      const volume = await receiver.volumeUp();
      throttledReportAudioStatus();
    } else if (packet.data.val === CEC.UserControlCode.VOLUME_DOWN) {
      const volume = await receiver.volumeDown();
      throttledReportAudioStatus();
    } else if (packet.data.val === CEC.UserControlCode.MUTE) {
      await receiver.toggleMute();
      throttledReportAudioStatus();
    }
  });

  monitor.on(CECMonitor.EVENTS.SYSTEM_AUDIO_MODE_STATUS, packet => {
    console.log("AUDIO SYSTEM STATUS:", packet);
  });

  let initNeeded = false;
  monitor.on(CECMonitor.EVENTS.REPORT_POWER_STATUS, packet => {
    if (
      packet.flow === "OUT" &&
      packet.data.val == CEC.PowerStatus.IN_TRANSITION_STANDBY_TO_ON
    ) {
      console.log("INIT NEEDED");
      initNeeded = true;
    } else if (
      initNeeded &&
      packet.flow === "OUT" &&
      packet.data.val === CEC.PowerStatus.ON
    ) {
      initNeeded = false;
      setTimeout(initAudio, 200);
      setTimeout(initAudio, 5000);
    }
  });

  monitor.on(CECMonitor.EVENTS.GIVE_AUDIO_STATUS, async packet => {
    console.log("AUDIO STATUS", packet.source);
    reportAudioStatus(packet.source);
  });

  monitor.on(CECMonitor.EVENTS._OPCODE, function(packet) {
    console.log(JSON.stringify(packet));
  });

  return monitor;
};

module.exports = { volumeSync };
