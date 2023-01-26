import fetch from "node-fetch";

export async function getBuyExactQuote(chainId, nfts, pool) {
  const serverAddress = "https://trade-router-absrz.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const requestURL =
    serverAddress +
    "/buyExact?nfts=" +
    nfts +
    "&pool=" +
    pool +
    "&chainId=" +
    chainId;
  console.log(requestURL);
  const buyExactQuoteResponse = await fetch(requestURL, options).catch((err) =>
    console.error(err)
  );
  const buyExactQuote = await buyExactQuoteResponse.json();

  return buyExactQuote;
}
