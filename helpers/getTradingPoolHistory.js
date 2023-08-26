import fetch from "node-fetch";

export async function getTradingPoolHistory(chainId, pool, address) {
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
      pool +
      (address ? "&address=" + address : "")
  );

  // Send address to server to get trading pool history for that address
  // If no address is provided, get trading pool history for whole pool
  const tradingPoolHistoryResponse = await fetch(
    serverAddress +
      "/trading/poolHistory" +
      "?chainId=" +
      chainId +
      "&pool=" +
      pool +
      (address ? "&address=" + address : ""),
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
