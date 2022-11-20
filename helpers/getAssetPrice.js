import fetch from "node-fetch";

export async function getAssetPrice(
  collection,
  tokenId,
  chainId,
  requestId = ""
) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  console.log("Getting price Sig from chain:", chainId);
  const requestURL =
    serverAddress +
    "/api/assetPrice?requestId=" +
    requestId +
    "&collection=" +
    collection +
    "&tokenId=" +
    tokenId +
    "&chainId=" +
    chainId;
  console.log(requestURL);
  const assetPriceResponse = await fetch(requestURL, options).catch((err) =>
    console.error(err)
  );
  const assetPrice = await assetPriceResponse.json();

  return assetPrice;
}
