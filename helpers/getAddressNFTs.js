import fetch from "node-fetch";

export async function getAddressNFTs(address, collection, chainId) {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  var collectionsURLString = "";
  if (collection) {
    collectionsURLString = "&collection=" + collection;
  }

  console.log(
    serverAddress +
      "/nfts/address?address=" +
      address +
      "&chainId=" +
      chainId +
      collectionsURLString
  );

  const nftsResponse = await fetch(
    serverAddress +
      "/nfts/address?address=" +
      address +
      "&chainId=" +
      chainId +
      collectionsURLString,
    options
  ).catch((err) => console.error(err));
  console.log("nftsREsponse", nftsResponse);
  const nfts = await nftsResponse.json();

  return nfts;
}
