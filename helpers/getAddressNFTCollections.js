import fetch from "node-fetch";

export async function getAddressNFTCollections(address, chainId) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const nftCollectionsResponse = await fetch(
    serverAddress +
      "/api/addressNFTCollections?address=" +
      address +
      "&chainId=" +
      chainId +
      collectionsURLString,
    options
  ).catch((err) => console.error(err));
  const nftCollections = await nftCollectionsResponse.json();

  return nftCollections;
}
