import fetch from "node-fetch";

export async function getLockInfo(chainId) {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const lockInfoResponse = await fetch(
    serverAddress + "/lock/info" + "?chainId=" + chainId,
    options
  ).catch((err) => console.error(err));
  var lockInfo = {};

  try {
    lockInfo = await lockInfoResponse.json();
  } catch (error) {
    console.log(error);
  }

  return lockInfo;
}
