import fetch from "node-fetch";

export async function getOpenOrders(chainId, pool, address) {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  console.log(
    serverAddress +
      "/trading/openOrders" +
      "?chainId=" +
      chainId +
      "&pool=" +
      pool +
      "&address=" +
      address
  );

  const openOrdersResponse = await fetch(
    serverAddress +
      "/trading/openOrders" +
      "?chainId=" +
      chainId +
      "&pool=" +
      pool +
      "&address=" +
      address,
    options
  ).catch((err) => console.error(err));
  var openOrders = [];

  try {
    openOrders = await openOrdersResponse.json();
  } catch (error) {
    console.log(error);
  }

  return openOrders;
}
