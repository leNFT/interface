import fetch from "node-fetch";

export async function getGaugeHistory(chainId, gauge) {
  const serverAddress = "https://lenft-api-w27ha.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const gaugeHistoryResponse = await fetch(
    serverAddress +
      "/api/gaugeHistory" +
      "?chainId=" +
      chainId +
      "&gauge=" +
      gauge,
    options
  ).catch((err) => console.error(err));
  var gaugeHistory = [];

  try {
    gaugeHistory = await gaugeHistoryResponse.json();
  } catch (error) {
    console.log(error);
  }

  return gaugeHistory;
}
