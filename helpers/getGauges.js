import fetch from "node-fetch";
import gaugesFilters from "../filters/gauges.json";

export async function getGauges(chainId) {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  console.log(serverAddress + "/gauges?chainId=" + chainId);

  const gaugesResponse = await fetch(
    serverAddress + "/gauges?chainId=" + chainId,
    options
  ).catch((err) => console.error(err));
  var gauges;

  try {
    gauges = await gaugesResponse.json();
  } catch (error) {
    console.log(error);
  }

  // Dont return hidden pools
  const { hidden: hiddenGauges } = gaugesFilters[chainId];

  const filteredGauges = Object.fromEntries(
    Object.entries(gauges).filter(([key]) => !hiddenGauges.includes(key))
  );

  return filteredGauges;
}
