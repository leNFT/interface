import fetch from "node-fetch";

export async function getGaugeBribes(chainId) {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const gaugeBribesResponse = await fetch(
    serverAddress + "/vote/bribes?chainId=" + chainId,
    options
  ).catch((err) => console.error(err));
  const gaugeBribes = await gaugeBribesResponse.json();

  return gaugeBribes;
}
