import fetch from "node-fetch";
import { ethers } from "ethers";
import vaultABI from "../contracts/vaultABI.json";

export async function getNativeTokenPrice(chainId) {
  const vaultAddress = "0xBA12222222228d8Ba445958a75a0704d566BF2C8";
  const poolId =
    "0x8e6c196e201942246cef85718c5d3a5622518053000200000000000000000582";

  const vaultContract = new ethers.Contract(
    vaultAddress,
    vaultABI,
    ethers.getDefaultProvider(chainId)
  );

  const [tokens, balances, lastChangeBlock] = await vaultContract.getPoolTokens(
    poolId
  );

  console.log("ctokens", tokens);
  console.log("balances", balances);

  // Each pair of tokens in a pool has a spot price defined entirely by the
  // weights and balances of just that pair of tokens.
  //The spot price between any two tokens is the the ratio of the
  // token balances normalized by their weights

  const normalizedBalance0 = balances[0] / 80;
  const normalizedBalance1 = balances[1] / 20;

  const spotPrice = normalizedBalance1 / normalizedBalance0;

  console.log("normalizedBalance0", normalizedBalance0);
  console.log("normalizedBalance1", normalizedBalance1);
  console.log("spotPrice", spotPrice);

  return Number(spotPrice).toPrecision(8);
}
