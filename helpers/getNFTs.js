import fetch from "node-fetch";

export async function getNFTs(owner, collection, chainId) {
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
    "/getNFTs";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  const contractAddressString = collection
    ? "&contractAddresses[]=" + collection
    : "";
  const getNFTsResponse = await fetch(
    serverAddress + "?owner=" + owner + contractAddressString,
    options
  ).catch((err) => console.error(err));
  const nfts = await getNFTsResponse.json();
  console.log("nfts", nfts);

  return nfts.ownedNfts;
}
