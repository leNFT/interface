import fetch from "node-fetch";

export async function getTradingPoolHistory(chainId, pool) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const tradingPoolHistoryResponse = await fetch(
    serverAddress +
      "/api/tradingPoolHistory" +
      "?chainId=" +
      chainId +
      "&pool=" +
      pool,
    options
  ).catch((err) => console.error(err));
  var tradingPoolHistory = [];

  try {
    tradingPoolHistory = await tradingPoolHistoryResponse.json();
  } catch (error) {
    console.log(error);
  }

  return tradingPoolHistory;
}
