import { BigNumber } from "@ethersproject/bignumber";

export function calculateHealthLevel(debtString, maxDebtString) {
  console.log("debtString", debtString);
  console.log("maxDebtString", maxDebtString);
  if (BigNumber.from(maxDebtString).eq(0)) {
    return 0;
  }
  return BigNumber.from(100)
    .sub(BigNumber.from(debtString).mul(BigNumber.from(100)).div(maxDebtString))
    .toNumber();
}
