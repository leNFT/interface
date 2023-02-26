import fetch from "node-fetch";

export async function getTradingPools(chainId, pool) {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  var poolURLString = "";
  if (pool) {
    poolURLString = "&pool=" + pool;
  }

  console.log(
    serverAddress + "/trading/pools?chainId=" + chainId + poolURLString
  );

  const tradingPoolsResponse = await fetch(
    serverAddress + "/trading/pools?chainId=" + chainId + poolURLString,
    options
  ).catch((err) => console.error(err));
  var tradingPools;

  try {
    tradingPools = await tradingPoolsResponse.json();
  } catch (error) {
    console.log(error);
  }

  return tradingPools;
}
