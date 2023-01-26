import fetch from "node-fetch";

export async function getSwapQuote(
  chainId,
  buyNFTs,
  sellAmount,
  buyPool,
  sellPool
) {
  const serverAddress = "https://trade-router-absrz.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const requestURL =
    serverAddress +
    "/swapExact?chainId=" +
    chainId +
    "&buyNFTs=" +
    buyNFTs +
    "&sellAmount=" +
    sellAmount +
    "&buyPool=" +
    buyPool +
    "&sellPool=" +
    sellPool;
  console.log(requestURL);
  const swapQuoteResponse = await fetch(requestURL, options).catch((err) =>
    console.error(err)
  );
  const swapQuote = await swapQuoteResponse.json();

  return swapQuote;
}
