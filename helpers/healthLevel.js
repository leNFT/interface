import { BigNumber } from "@ethersproject/bignumber";

export function calculateHealthLevel(debtString, maxCollateralString) {
  const maxCollateralNumber = BigNumber.from(maxCollateralString);
  const debtNumber = BigNumber.from(debtString);
  return maxCollateralNumber
    .sub(debtNumber)
    .mul(BigNumber.from(100))
    .div(maxCollateralNumber)
    .toNumber();
}
