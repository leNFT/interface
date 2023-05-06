import { BigNumber } from "@ethersproject/bignumber";

export function calculateHealthLevel(debtString, maxDebtString) {
  console.log("debtString", debtString);
  console.log("maxDebtString", maxDebtString);
  return BigNumber.from(100)
    .sub(BigNumber.from(debtString).mul(BigNumber.from(100)).div(maxDebtString))
    .toNumber();
}
