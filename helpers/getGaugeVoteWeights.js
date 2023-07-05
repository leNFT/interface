import fetch from "node-fetch";

export async function getGaugeVoteWeights(chainId) {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const gaugeWeightsResponse = await fetch(
    serverAddress + "/vote/weights?chainId=" + chainId,
    options
  ).catch((err) => console.error(err));
  const gaugeWeights = await gaugeWeightsResponse.json();

  return gaugeWeights;
}
