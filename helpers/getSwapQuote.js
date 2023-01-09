import fetch from "node-fetch";

export async function getBuyQuote(chainId, amount, pool) {
  const serverAddress = "https://trade-router-absrz.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const requestURL =
    serverAddress +
    "/swap?amount=" +
    amount +
    "&chainId=" +
    chainId +
    "&pool=" +
    pool;
  console.log(requestURL);
  const buyQuoteResponse = await fetch(requestURL, options).catch((err) =>
    console.error(err)
  );
  const buyQuote = await buyQuoteResponse.json();

  return buyQuote;
}
