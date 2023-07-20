import fetch from "node-fetch";

export async function getGenesisMintCount(chainId) {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const mintCountResponse = await fetch(
    serverAddress + "/genesis/mintCount?chainId=" + chainId,
    options
  ).catch((err) => console.error(err));
  const mintCount = await mintCountResponse.json();

  return mintCount;
}
