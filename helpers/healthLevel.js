import { BigNumber } from "@ethersproject/bignumber";

export function calculateHealthLevel(
  debtString,
  maxCollateralString,
  boostString
) {
  const maxCollateralNumber = BigNumber.from(maxCollateralString);
  const boostNumber = BigNumber.from(boostString);
  const debtNumber = BigNumber.from(debtString);
  return maxCollateralNumber
    .sub(debtNumber)
    .mul(BigNumber.from(100))
    .div(maxCollateralNumber + boostNumber)
    .toNumber();
}
