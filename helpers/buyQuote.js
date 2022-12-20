import fetch from "node-fetch";

export async function getBuyQuote(chainId, nfts) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const requestURL =
    serverAddress + "/api/buyQuote?nfts=" + nfts + "&chainId=" + chainId;
  console.log(requestURL);
  const buyQuoteResponse = await fetch(requestURL, options).catch((err) =>
    console.error(err)
  );
  const buyQuote = await buyQuoteResponse.json();

  return buyQuote;
}
