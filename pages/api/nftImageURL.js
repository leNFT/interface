export default async function handler(req, res) {
  const { address, tokenId, chainId } = req.query;

  var chainName;
  if (chainId == 1) {
    chainName = "mainnet";
  } else if (chainId == 5) {
    chainName = "goerli";
  } else {
    return "Unsupported ChainID";
  }

  const serverAddress =
    "https://eth-" +
    chainName +
    ".g.alchemy.com/nft/v2/" +
    process.env.ALCHEMY_API_KEY +
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

  if (nftMetadata.media[0].gateway) {
    res.status(200).json(nftMetadata.media[0].gateway);
  } else {
    res.status(200).json(nftMetadata.tokenUri.gateway);
  }
}
