import fetch from "node-fetch";

export async function getNativeTokenPrice() {
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  };

  const nativeTokenPriceResponse = await fetch(
    serverAddress + "/token/price",
    options
  ).catch((err) => console.error(err));

  return await nativeTokenPriceResponse.json();
}
