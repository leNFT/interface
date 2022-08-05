import { BigNumber } from "@ethersproject/bignumber";

export function calculateHealthLevel(debtString, maxCollateralString) {
  const maxCollateralNumber = BigNumber.from(maxCollateralString);
  const debtNumber = BigNumber.from(debtString);

  console.log("Calculation health level...");
  console.log("Debt:", debtString);
  console.log("Max Collateral:", maxCollateralString);

  return maxCollateralNumber
    .sub(debtNumber)
    .mul(BigNumber.from(100))
    .div(maxCollateralNumber)
    .toNumber();
}
