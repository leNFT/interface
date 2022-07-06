import { BigNumber } from "@ethersproject/bignumber";
import styles from "../styles/Home.module.css";
import { formatUnits, parseUnits } from "@ethersproject/units";
import contractAddresses from "../contractAddresses.json";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import marketContract from "../contracts/Market.json";
import reserveContract from "../contracts/Reserve.json";
import { Typography } from "web3uikit";
import LinearProgressWithLabel from "./LinearProgressWithLabel";

export default function ReserveInfo() {
  const [debt, setDebt] = useState("0");
  const [underlyingBalance, setUnderlyingBalance] = useState("0");
  const [supplyRate, setSupplyRate] = useState(0);
  const [utilizationRate, setUtilizationRate] = useState(0);
  const [reserveAddress, setReserveAddress] = useState("");
  const { isWeb3Enabled, chainId, account } = useMoralis();

  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const { runContractFunction: getReserveAddress } = useWeb3Contract({
    abi: marketContract.abi,
    contractAddress: addresses.Market,
    functionName: "getReserveAddress",
    params: {
      asset: addresses.WETH,
    },
  });

  const { runContractFunction: getUnderlyingBalance } = useWeb3Contract({
    abi: reserveContract.abi,
    contractAddress: reserveAddress,
    functionName: "getUnderlyingBalance",
    params: {},
  });

  const { runContractFunction: getDebt } = useWeb3Contract({
    abi: reserveContract.abi,
    contractAddress: reserveAddress,
    functionName: "getDebt",
    params: {},
  });

  const { runContractFunction: getUtilizationRate } = useWeb3Contract({
    abi: reserveContract.abi,
    contractAddress: reserveAddress,
    functionName: "getUtilizationRate",
    params: {},
  });

  const { runContractFunction: getSupplyRate } = useWeb3Contract({
    abi: reserveContract.abi,
    contractAddress: reserveAddress,
    functionName: "getCumulativeBorrowRate",
    params: {},
  });

  async function getReserve() {
    const updatedReserveAddress = (
      await getReserveAddress({
        onError: (error) => console.log(error),
      })
    ).toString();
    setReserveAddress(updatedReserveAddress);
    console.log("updatedReserveAddress", updatedReserveAddress);
  }

  async function getReserveDetails() {
    const updatedDebt = await getDebt({
      onError: (error) => console.log(error),
    });
    console.log("Updated Debt:", updatedDebt);
    setDebt(updatedDebt.toString());

    const updatedUnderlyingBalance = await getUnderlyingBalance({
      onError: (error) => console.log(error),
    });
    console.log("Updated Underlying Balance:", updatedUnderlyingBalance);
    setUnderlyingBalance(updatedUnderlyingBalance.toString());

    const updatedUtilizationRate = await getUtilizationRate({
      onError: (error) => console.log(error),
    });
    console.log("Updated Utilization Rate:", updatedUtilizationRate);
    setUtilizationRate(updatedUtilizationRate.toNumber());

    const updatedSupplyRate = await getSupplyRate({
      onError: (error) => console.log(error),
    });
    console.log("Updated Supply Rate:", updatedSupplyRate);
    setSupplyRate(updatedSupplyRate.toNumber());
  }

  useEffect(() => {
    if (isWeb3Enabled) {
      getReserve();
    }
  }, [isWeb3Enabled]);

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    if (reserveAddress) {
      console.log("Got reserve address, setting the rest...", reserveAddress);
      getReserveDetails();
    }
  }, [reserveAddress]);

  return (
    <div className={styles.container}>
      <div className="mb-8">
        <Typography variant="h1" color="blueCloudDark">
          Supply Rate is {supplyRate / 100}%
        </Typography>
      </div>
      <div>
        <Typography variant="h4">Reserve Utilization:</Typography>
        <LinearProgressWithLabel value={utilizationRate / 100} />
      </div>

      <div>
        <Typography variant="caption14">
          Underlying is {formatUnits(underlyingBalance, 18)} WETH
        </Typography>
      </div>
      <div>
        <Typography variant="caption14">
          Debt is {formatUnits(debt, 18)} WETH
        </Typography>
      </div>
    </div>
  );
}
