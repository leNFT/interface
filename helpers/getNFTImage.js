import fetch from "node-fetch";

export async function getNFTImage(collection, tokenId, chainId) {
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  const nftImageResponse = await fetch(
    "/api/nftImageURL?address=" +
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
