import fetch from "node-fetch";

export async function getTradingPoolOrderbook(chainId, pool) {
  const serverAddress = "https://trade-router-absrz.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  console.log(
    serverAddress + "/orderbook?pool=" + pool + "&chainId=" + chainId
  );
  const orderbookResponse = await fetch(
    serverAddress + "/orderbook?pool=" + pool + "&chainId=" + chainId,
    options
  ).catch((err) => console.error(err));
  const orderbook = await orderbookResponse.json();

  return orderbook;
}
