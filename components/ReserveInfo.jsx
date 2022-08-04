import { Button, Modal, Typography, Tooltip } from "@web3uikit/core";
import { HelpCircle } from "@web3uikit/icons";
import styles from "../styles/Home.module.css";
import { formatUnits } from "@ethersproject/units";
import contractAddresses from "../contractAddresses.json";
import { useState, useEffect } from "react";
import { useMoralis, useWeb3Contract } from "react-moralis";
import marketContract from "../contracts/Market.json";
import tokenOracleContract from "../contracts/TokenOracle.json";
import reserveContract from "../contracts/Reserve.json";
import LinearProgressWithLabel from "./LinearProgressWithLabel";
import Deposit from "./Deposit";
import Withdraw from "./Withdraw";

export default function ReserveInfo(props) {
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const [debt, setDebt] = useState("0");
  const [visibleDepositModal, setVisibleDepositModal] = useState(false);
  const [visibleWithdrawalModal, setVisibleWithdrawalModal] = useState(false);
  const [maxAmount, setMaxAmount] = useState("0");
  const [underlyingBalance, setUnderlyingBalance] = useState("0");
  const [supplyRate, setSupplyRate] = useState(0);
  const [utilizationRate, setUtilizationRate] = useState(0);
  const [reserveAddress, setReserveAddress] = useState("");
  const [ethPrice, setETHPrice] = useState("0");

  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const { runContractFunction: getReserveAddress } = useWeb3Contract({
    abi: marketContract.abi,
    contractAddress: addresses.Market,
    functionName: "getReserveAddress",
    params: {
      asset: addresses[props.asset].address,
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
    functionName: "getSupplyRate",
    params: {},
  });

  const { runContractFunction: getMaximumWithdrawalAmount } = useWeb3Contract({
    abi: reserveContract.abi,
    contractAddress: reserveAddress,
    functionName: "getMaximumWithdrawalAmount",
    params: {
      to: account,
    },
  });

  const { runContractFunction: getTokenETHPrice } = useWeb3Contract();

  async function updateAssetETHPrice() {
    const updatedAssetETHPriceOptions = {
      abi: tokenOracleContract.abi,
      contractAddress: addresses.TokenOracle,
      functionName: "getTokenETHPrice",
      params: {
        token: addresses[props.asset].address,
      },
    };

    console.log(
      "addresses[props.asset].address",
      addresses[props.asset].address
    );

    const updatedAssetETHPrice = (
      await getTokenETHPrice({
        onError: (error) => console.log(error),
        params: updatedAssetETHPriceOptions,
      })
    ).toString();
    setETHPrice(updatedAssetETHPrice);
    console.log("updatedAssetETHPrice", updatedAssetETHPrice);
  }

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

    const updatedMaxAmount = await getMaximumWithdrawalAmount({
      onError: (error) => console.log(error),
    });
    console.log("Updated Max Withdrawal Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount.toString());
  }

  useEffect(() => {
    if (isWeb3Enabled && props.asset) {
      getReserve();
      console.log("props.asset", props.asset);
      updateAssetETHPrice();
    }
  }, [isWeb3Enabled, props.asset]);

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    if (reserveAddress) {
      console.log("Got reserve address, setting the rest...", reserveAddress);
      getReserveDetails();
    }
  }, [reserveAddress]);

  return (
    <div className={styles.container}>
      <Modal
        hasFooter={false}
        title={"Deposit " + props.asset}
        isVisible={visibleDepositModal}
        width="50%"
        onCloseButtonPressed={function () {
          setVisibleDepositModal(false);
        }}
      >
        <Deposit setVisibility={setVisibleDepositModal} asset={props.asset} />
      </Modal>
      <Modal
        hasFooter={false}
        title={"Withdraw " + props.asset}
        width="50%"
        isVisible={visibleWithdrawalModal}
        onCloseButtonPressed={function () {
          setVisibleWithdrawalModal(false);
        }}
      >
        <Withdraw
          setVisibility={setVisibleWithdrawalModal}
          asset={props.asset}
        />
      </Modal>
      <div className="flex items-center justify-center">
        <div className="flex flex-col items-center m-16">
          <div className="flex flex-col m-4 border-4 rounded-2xl">
            <div className="flex flex-row m-2">
              <div className="flex flex-col">
                <Typography variant="subtitle1">My Reserve Balance</Typography>
              </div>
              <div className="flex flex-col ml-1">
                <Tooltip
                  content="Deposits + interest accrued by the protocol"
                  position="top"
                  minWidth={200}
                >
                  <HelpCircle
                    fontSize="20px"
                    color="#000000"
                    title="HelpCircle Icon"
                  />
                </Tooltip>
              </div>
            </div>
            <div className="flex flex-row mx-2 mb-2">
              <Typography variant="body16">
                {formatUnits(maxAmount, addresses[props.asset].decimals) +
                  " " +
                  props.asset}
              </Typography>
            </div>
          </div>
          <div className="flex flex-row">
            <div className="m-4">
              <Button
                text="Deposit"
                theme="colored"
                type="button"
                size="large"
                color="blue"
                radius="5"
                onClick={async function () {
                  setVisibleDepositModal(true);
                }}
              />
            </div>
            <div className="m-4">
              <Button
                text="Withdraw"
                theme="colored"
                type="button"
                size="large"
                color="blue"
                radius="5"
                onClick={async function () {
                  setVisibleWithdrawalModal(true);
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col m-16">
          <div className="mb-8">
            <Typography variant="h1" color="blueCloudDark">
              Supply Rate @ {supplyRate / 100}%
            </Typography>
          </div>
          <div>
            <Typography variant="body16">Utilization Rate:</Typography>
            <LinearProgressWithLabel value={utilizationRate / 100} />
          </div>

          <div>
            <Typography variant="caption14">
              Underlying is{" "}
              {formatUnits(underlyingBalance, addresses[props.asset].decimals) +
                " " +
                props.asset}
            </Typography>
          </div>
          <div>
            <Typography variant="caption14">
              Debt is{" "}
              {formatUnits(debt, addresses[props.asset].decimals) +
                " " +
                props.asset}
            </Typography>
          </div>
          <div>
            <Typography variant="caption14">
              {"1 " + props.asset + " = " + formatUnits(ethPrice, 18) + " ETH"}
            </Typography>
          </div>
        </div>
      </div>
    </div>
  );
}
