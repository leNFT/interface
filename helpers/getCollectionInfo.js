import fetch from "node-fetch";

export async function getCollectionInfo(address, chainId) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  const requestURL =
    serverAddress +
    "/api/collection?address=" +
    address +
    "&chainId=" +
    chainId;
  console.log(requestURL);
  const collectionResponse = await fetch(requestURL, options).catch((err) =>
    console.error(err)
  );
  const collection = await collectionResponse.json();

  return collection;
}
