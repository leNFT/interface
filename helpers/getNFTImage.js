import fetch from "node-fetch";

export async function getNFTImage(address, tokenId, chainId) {
  var chainName;
  if (chainId == "0x1") {
    chainName = "mainnet";
  } else if (chainId == "0x5") {
    chainName = "goerli";
  } else {
    return "Unsupported ChainID";
  }

  const serverAddress =
    "https://eth-" +
    chainName +
    ".g.alchemy.com/nft/v2/" +
    process.env.NEXT_PUBLIC_ALCHEMY_API_KEY +
    "/getNFTMetadata";

  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  const getNFTMetadataResponse = await fetch(
    serverAddress + "?contractAddress=" + address + "&tokenId=" + tokenId,
    options
  ).catch((err) => console.error(err));
  const nftMetadata = await getNFTMetadataResponse.json();
  console.log(nftMetadata);

  if (nftMetadata.media[0].gateway) {
    return nftMetadata.media[0].gateway;
  } else {
    return nftMetadata.tokenUri.gateway;
  }
}
