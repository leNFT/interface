import fetch from "node-fetch";

export async function getTradingPools(chainId) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const lendingPoolsResponse = await fetch(
    serverAddress + "/api/reserves?chainId=" + chainId,
    options
  ).catch((err) => console.error(err));
  var lendingPools = [];

  try {
    lendingPools = await lendingPoolsResponse.json();
  } catch (error) {
    console.log(error);
  }

  return lendingPools;
}
