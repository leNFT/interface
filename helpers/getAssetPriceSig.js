import crypto from "crypto";
import fetch from "node-fetch";

export async function getAssetPriceSig(
  requestId,
  collection,
  tokenId,
  chainId
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
    "/api/assetPriceSig?requestId=" +
    requestId +
    "&address=" +
    collection +
    "&tokenId=" +
    tokenId +
    "&chainId=" +
    chainId;
  console.log(requestURL);
  const tokenBestBidResponse = await fetch(requestURL, options).catch((err) =>
    console.error(err)
  );
  const priceSig = await tokenBestBidResponse.json();

  return priceSig;
}

export function getNewRequestID() {
  const requestID = crypto.randomBytes(32).toString("hex");
  return "0x" + requestID;
}
