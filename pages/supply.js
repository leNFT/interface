import styles from "../styles/Home.module.css";
import { Button, Modal } from "web3uikit";
import ReserveDetails from "../components/ReserveDetails";
import contractAddresses from "../contractAddresses.json";
import { useState, useEffect } from "react";
import Deposit from "../components/Deposit";
import Withdraw from "../components/Withdraw";
import marketContract from "../contracts/Market.json";
import reserveContract from "../contracts/Reserve.json";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { formatUnits, parseUnits } from "@ethersproject/units";

export default function Supply() {
  const [visibleDepositModal, setVisibleDepositModal] = useState(false);
  const [visibleWithdrawalModal, setVisibleWithdrawalModal] = useState(false);
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const [maxAmount, setMaxAmount] = useState("0");
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const { runContractFunction: getReserveAddress } = useWeb3Contract({
    abi: marketContract.abi,
    contractAddress: addresses.Market,
    functionName: "getReserveAddress",
    params: {
      asset: addresses.wETH,
    },
  });

  const { runContractFunction: getMaximumWithdrawalAmount } = useWeb3Contract();

  async function updateMaxAmount() {
    const reserveAddress = (await getReserveAddress()).toString();

    const maxWithdrawalOptions = {
      abi: reserveContract.abi,
      contractAddress: reserveAddress,
      functionName: "getMaximumWithdrawalAmount",
      params: {
        to: account,
      },
    };

    const updatedMaxAmount = (
      await getMaximumWithdrawalAmount({
        params: maxWithdrawalOptions,
      })
    ).toString();

    console.log("Updated Max Withdrawal Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount);
  }

  //Run once
  useEffect(() => {
    if (isWeb3Enabled) {
      updateMaxAmount();
    }
  }, [isWeb3Enabled]);

  //Run once
  useEffect(() => {
    if (isWeb3Enabled) {
      updateMaxAmount();
    }
  }, [isWeb3Enabled]);

  return (
    <div className={styles.container}>
      <Modal
        hasFooter={false}
        title="Deposit wETH"
        isVisible={visibleDepositModal}
        onCloseButtonPressed={function () {
          setVisibleDepositModal(false);
        }}
      >
        <Deposit />
      </Modal>
      <Modal
        hasFooter={false}
        title="Withdraw wETH"
        isVisible={visibleWithdrawalModal}
        onCloseButtonPressed={function () {
          setVisibleWithdrawalModal(false);
        }}
      >
        <Withdraw />
      </Modal>
      <div className="flex items-center justify-center">
        <div className="flex flex-col items-center m-16">
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
          <div className="flex flex-row">
            Reserve Balance: {formatUnits(maxAmount, 18)} wETH
          </div>
        </div>
        <div className="flex flex-col items-center m-16">
          <ReserveDetails />
        </div>
      </div>
    </div>
  );
}
