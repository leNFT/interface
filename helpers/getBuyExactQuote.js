import fetch from "node-fetch";

export async function getBuyExactQuote(chainId, amount) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const requestURL =
    serverAddress + "/api/buyExact?amount=" + amount + "&chainId=" + chainId;
  console.log(requestURL);
  const buyAnyQuoteResponse = await fetch(requestURL, options).catch((err) =>
    console.error(err)
  );
  const buyAnyQuote = await buyAnyQuoteResponse.json();

  return buyAnyQuote;
}
