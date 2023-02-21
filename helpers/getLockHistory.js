import fetch from "node-fetch";

export async function getLockHistory(chainId) {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const lockHistoryResponse = await fetch(
    serverAddress + "/lock/history" + "?chainId=" + chainId,
    options
  ).catch((err) => console.error(err));
  var lockHistory = [];

  try {
    lockHistory = await lockHistoryResponse.json();
  } catch (error) {
    console.log(error);
  }

  return lockHistory;
}
