import fetch from "node-fetch";

export async function getNFTImage(collection, tokenId, chainId) {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  console.log(
    serverAddress +
      "/nfts/imageURL?address=" +
      collection +
      "&tokenId=" +
      tokenId +
      "&chainId=" +
      chainId
  );
  const nftImageResponse = await fetch(
    serverAddress +
      "/nfts/imageURL?address=" +
      collection +
      "&tokenId=" +
      tokenId +
      "&chainId=" +
      chainId,
    options
  ).catch((err) => console.error(err));
  const nftImage = await nftImageResponse.json();

  return nftImage;
}
