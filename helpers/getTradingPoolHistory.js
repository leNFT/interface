import fetch from "node-fetch";

export async function getTradingPoolHistory(chainId, pool) {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  console.log(
    serverAddress +
      "/trading/poolHistory" +
      "?chainId=" +
      chainId +
      "&pool=" +
      pool
  );

  const tradingPoolHistoryResponse = await fetch(
    serverAddress +
      "/trading/poolHistory" +
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
