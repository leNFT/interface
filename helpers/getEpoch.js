export function getEpoch() {
  const epochDuration = 60 * 60 * 24 * 7; // 1 week
  const deployTimestamp =
    Math.floor(1688110295 / epochDuration) * epochDuration;
  const currentTimestamp = Math.floor(Date.now() / 1000);

  const epoch = Math.floor(
    (currentTimestamp - deployTimestamp) / epochDuration
  );

  return epoch;
}
