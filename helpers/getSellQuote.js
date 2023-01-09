import fetch from "node-fetch";

export async function getSellQuote(chainId, amount, pool) {
  const serverAddress = "https://trade-router-absrz.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const requestURL =
    serverAddress +
    "/sell?amount=" +
    amount +
    "&chainId=" +
    chainId +
    "&pool=" +
    pool;
  console.log(requestURL);
  const sellQuoteResponse = await fetch(requestURL, options).catch((err) =>
    console.error(err)
  );
  const sellQuote = await sellQuoteResponse.json();

  return sellQuote;
}
