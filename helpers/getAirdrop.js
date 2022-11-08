import crypto from "crypto";
import fetch from "node-fetch";

export async function getAirdrop(address, chainId, requestId = "") {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  console.log("Getting airdrop Sig from chain:", chainId);
  const requestURL =
    serverAddress +
    "/api/airdrop?requestId=" +
    requestId +
    "&address=" +
    address +
    "&chainId=" +
    chainId;
  console.log(requestURL);
  const airdropResponse = await fetch(requestURL, options).catch((err) =>
    console.error(err)
  );
  const airdrop = await airdropResponse.json();

  return airdrop;
}

export function getNewRequestID() {
  const requestID = crypto.randomBytes(32).toString("hex");
  return "0x" + requestID;
}
