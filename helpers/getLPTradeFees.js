import fetch from "node-fetch";

export async function getLPTradeFees(chainId, pool, lpId) {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  console.log(
    serverAddress +
      "/trading/lpTradeFees" +
      "?chainId=" +
      chainId +
      "&pool=" +
      pool +
      "&lpId=" +
      lpId
  );

  const lpTradeFeesResponse = await fetch(
    serverAddress +
      "/trading/lpTradeFees" +
      "?chainId=" +
      chainId +
      "&pool=" +
      pool +
      "&lpId=" +
      lpId,
    options
  ).catch((err) => console.error(err));

  return await lpTradeFeesResponse.json();
}
