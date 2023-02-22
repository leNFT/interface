import fetch from "node-fetch";

export async function getAddressNFTCollections(address, chainId) {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const nftCollectionsResponse = await fetch(
    serverAddress +
      "/nfts/addressCollections?address=" +
      address +
      "&chainId=" +
      chainId,
    options
  ).catch((err) => console.error(err));
  const nftCollections = await nftCollectionsResponse.json();

  return nftCollections;
}
