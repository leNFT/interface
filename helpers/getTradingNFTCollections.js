import fetch from "node-fetch";

export async function getTradingNFTCollections(chainId) {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";

  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  const response = await fetch(
    serverAddress + "/trading/collections?chainId=" + chainId,
    options
  ).catch((err) => console.error(err));
  var collections = [];

  try {
    collections = await response.json();
  } catch (error) {
    console.log(error);
  }

  return collections;
}
