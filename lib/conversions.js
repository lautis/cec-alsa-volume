const volumeOffset = 50;
const alsaVolumeRange = 100 - volumeOffset;
const cecVolumeRange = 100;
const cecVolume = (muted, volume) => {
  const muteFactor = muted ? 0x80 : 0;
  return (
    muteFactor +
    Math.floor(
      Math.max(((volume - volumeOffset) * cecVolumeRange) / alsaVolumeRange, 0)
    )
  );
};

const conversions = (min = 0, max = 100) => {
  const alsaVolumeRange = max - min;
  const cecVolumeRange = 100;
  return (muted, volume) => {
    const muteFactor = muted ? 0x80 : 0;
    return (
      muteFactor +
      Math.floor(
        Math.max(((volume - min) * cecVolumeRange) / alsaVolumeRange, 0)
      )
    );
  };
};

module.exports = { conversions, cecVolume };
