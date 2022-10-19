import fetch from "node-fetch";

export async function getSupportedNFTs(chainId) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  const response = await fetch(
    serverAddress + "/api/supportedNFTs?chainId=" + chainId,
    options
  ).catch((err) => console.error(err));
  var nfts = [];

  try {
    nfts = await response.json();
  } catch (error) {
    console.log(error);
  }

  return nfts;
}
