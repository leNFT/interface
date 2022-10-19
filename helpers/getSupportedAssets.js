import fetch from "node-fetch";

export async function getSupportedAssets(chainId) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  const response = await fetch(
    serverAddress + "/api/supportedAssets?chainId=" + chainId,
    options
  ).catch((err) => console.error(err));
  var assets = [];

  try {
    assets = await response.json();
  } catch (error) {
    console.log(error);
  }

  return assets;
}
