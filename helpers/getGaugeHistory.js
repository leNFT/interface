import fetch from "node-fetch";

export async function getGaugeHistory(chainId, gauge) {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  console.log(
    serverAddress +
      "/gauges/history" +
      "?chainId=" +
      chainId +
      "&gauge=" +
      gauge
  );

  const gaugeHistoryResponse = await fetch(
    serverAddress +
      "/gauges/history" +
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
