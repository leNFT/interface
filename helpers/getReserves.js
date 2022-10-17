import fetch from "node-fetch";

export async function getReserves(chainId) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };
  const reservesResponse = await fetch(
    serverAddress + "/api/reserves?chainId=" + chainId,
    options
  ).catch((err) => console.error(err));
  var reserves = [];

  try {
    await reservesResponse.json();
  } catch (error) {
    console.log(error);
  }

  return reserves;
}
