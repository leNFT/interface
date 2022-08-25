export default async function handler(req, res) {
  const { address, collection, chainId } = req.query;

  var chainName;
  console.log(chainId);
  if (chainId == 1) {
    chainName = "eth";
  } else if (chainId == 5) {
    chainName = "goerli";
  } else {
    res.status(400).json({ error: "Invalid chainId" });
  }

  var collectionsURLString = "";
  if (collection) {
    collectionsURLString = "&token_addresses=" + collection;
  }

  const serverAddress = "https://deep-index.moralis.io/api/v2/";
  console.log(process.env.MORALIS_API_KEY);

  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-API-Key": process.env.MORALIS_API_KEY,
    },
  };
  const getNFTsResponse = await fetch(
    serverAddress +
      address +
      "/nft?chain=" +
      chainName +
      "&format=decimal" +
      collectionsURLString,
    options
  ).catch((err) => console.error(err));
  const nfts = await getNFTsResponse.json();

  console.log("nfts", nfts);

  res.status(200).json(nfts);
}