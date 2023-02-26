import fetch from "node-fetch";

export async function getTradingPoolPrice(chainId, pool) {
  const serverAddress = "https://trade-router-absrz.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const requestURL =
    serverAddress + "/price?pool=" + pool + "&chainId=" + chainId;
  console.log(requestURL);
  const priceResponse = await fetch(requestURL, options).catch((err) =>
    console.error(err)
  );
  const price = await priceResponse.json();

  return price;
}
