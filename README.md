# CEC Alsa Volume

Sync HDMI CEC volume events with ALSA mixer.

Ever wanted to control the volume of speakers attached to Raspberry PI with your TV remove? This project will help you.

## Installation

The following software needs to be installed:

- [libcec](https://github.com/Pulse-Eight/libcec)
- alsa-utils
- Node

Install cec-alsa-volume with

```
npm install -g cec-alsa-volume
```

## Usage

```
cec-alsa-volume --min-volume 0 --max-volume 100 --mixer-device "hw:0" --mixer-name "PCM" --name "RaspberryPI"
```

## Compatibility

This is tested to work with a RaspberryPI and a LG TV. There might be issues with other devices as HDMI CEC is not the most interoperable standard.
