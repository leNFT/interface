import fetch from "node-fetch";

export async function getLendingPools(chainId) {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const lendingPoolsResponse = await fetch(
    serverAddress + "/lending/pools?chainId=" + chainId,
    options
  ).catch((err) => console.error(err));
  var lendingPools = [];

  try {
    lendingPools = await lendingPoolsResponse.json();
  } catch (error) {
    console.log(error);
  }

  return lendingPools;
}
