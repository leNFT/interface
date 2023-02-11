import fetch from "node-fetch";

export async function getAssetsPrice(
  collection,
  tokenIds,
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
    "/api/assetsPrice?requestId=" +
    requestId +
    "&collection=" +
    collection +
    "&tokenIds=" +
    tokenIds.join(",") +
    "&chainId=" +
    chainId;
  console.log(requestURL);
  const assetsPriceResponse = await fetch(requestURL, options).catch((err) =>
    console.error(err)
  );
  const assetPrice = await assetsPriceResponse.json();

  return assetPrice;
}
