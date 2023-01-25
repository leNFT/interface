import fetch from "node-fetch";

export async function getBuyExactQuote(chainId, nfts, pool) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const requestURL =
    serverAddress +
    "/api/buyExact?nfts=" +
    nfts +
    "&pool=" +
    pool +
    "&chainId=" +
    chainId;
  console.log(requestURL);
  const buyAnyQuoteResponse = await fetch(requestURL, options).catch((err) =>
    console.error(err)
  );
  const buyAnyQuote = await buyAnyQuoteResponse.json();

  return buyAnyQuote;
}
