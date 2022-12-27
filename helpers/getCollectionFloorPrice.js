import fetch from "node-fetch";

export async function getCollectionFloorPrice(address, chainId) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  const requestURL =
    serverAddress +
    "/api/collectionFloorPrice?address=" +
    address +
    "&chainId=" +
    chainId;
  console.log(requestURL);
  const floorPriceResponse = await fetch(requestURL, options).catch((err) =>
    console.error(err)
  );
  const floorPrice = await floorPriceResponse.json();

  return floorPrice;
}
