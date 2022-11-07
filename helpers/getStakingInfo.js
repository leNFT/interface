import fetch from "node-fetch";

export async function getStakingInfo(chainId) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  const response = await fetch(
    serverAddress + "/api/staking?chainId=" + chainId,
    options
  ).catch((err) => console.error(err));
  var stakingInfo = {};

  try {
    stakingInfo = await response.json();
  } catch (error) {
    console.log(error);
  }

  return stakingInfo;
}
