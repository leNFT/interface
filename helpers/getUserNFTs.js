import fetch from "node-fetch";

export async function getUserNFTs(address, collection, chainId) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  var collectionsURLString = "";
  if (collection != "") {
    collectionsURLString = "&collection=" + collection;
  }

  const nftseResponse = await fetch(
    serverAddress +
      "/api/userNFTs?address=" +
      address +
      "&chainId=" +
      chainId +
      collectionsURLString,
    options
  ).catch((err) => console.error(err));
  const nfts = await nftseResponse.json();

  return nfts;
}
