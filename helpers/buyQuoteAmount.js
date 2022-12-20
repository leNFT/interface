import fetch from "node-fetch";

export async function getBuyQuoteAmount(chainId, amount) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const requestURL =
    serverAddress +
    "/api/buyQuoteAmount?amount=" +
    amount +
    "&chainId=" +
    chainId;
  console.log(requestURL);
  const buyQuoteAmountResponse = await fetch(requestURL, options).catch((err) =>
    console.error(err)
  );
  const buyQuoteAmount = await buyQuoteAmountResponse.json();

  return buyQuoteAmount;
}
