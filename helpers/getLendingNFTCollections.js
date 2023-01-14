import fetch from "node-fetch";

export async function getLendingNFTCollections(chainId, reserve = "") {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  const response = await fetch(
    serverAddress +
      "/api/lendingNFTCollections?chainId=" +
      chainId +
      "&reserve=" +
      reserve,
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
