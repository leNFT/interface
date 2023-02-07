import fetch from "node-fetch";

export async function getTradingPools(chainId) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  console.log(serverAddress + "/api/tradingPools?chainId=" + chainId);

  const tradingPoolsResponse = await fetch(
    serverAddress + "/api/tradingPools?chainId=" + chainId,
    options
  ).catch((err) => console.error(err));
  var tradingPools = [];

  try {
    tradingPools = await tradingPoolsResponse.json();
  } catch (error) {
    console.log(error);
  }

  return tradingPools;
}
