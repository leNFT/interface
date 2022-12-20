import fetch from "node-fetch";

export async function getSellQuote(chainId, nfts) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const requestURL =
    serverAddress + "/api/sellQuote?nfts=" + nfts + "&chainId=" + chainId;
  console.log(requestURL);
  const sellQuoteResponse = await fetch(requestURL, options).catch((err) =>
    console.error(err)
  );
  const sellQuote = await sellQuoteResponse.json();

  return sellQuote;
}
