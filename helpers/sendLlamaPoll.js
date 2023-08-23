import fetch from "node-fetch";

export async function sendLlamaPoll(pollAnswer) {
  console.log("Sending llama poll to server", pollAnswer);
  const serverAddress = "https://api-h6nqa.ondigitalocean.app";
  const options = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ pollAnswer }),
  };

  console.log(serverAddress + "/llamas/poll");

  const llamaResponse = await fetch(
    serverAddress + "/llamas/poll",
    options
  ).catch((err) => console.error(err));

  const data = await llamaResponse.json();

  console.log(data);
}
