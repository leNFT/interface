import fetch from "node-fetch";

export async function getNFTs(address, collection, chainId) {
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
