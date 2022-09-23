import { useNotification } from "@web3uikit/core";
import { BigNumber } from "@ethersproject/bignumber";
import styles from "../styles/Home.module.css";
import { Button, Input, Typography } from "@web3uikit/core";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { ethers } from "ethers";
import reserveContract from "../contracts/Reserve.json";
import contractAddresses from "../contractAddresses.json";
import { useState, useEffect } from "react";
import marketContract from "../contracts/Market.json";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";

export default function Withdraw(props) {
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("0");
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const provider = useProvider();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const dispatch = useNotification();

  const marketSigner = useContract({
    contractInterface: marketContract.abi,
    addressOrName: addresses.Market,
    signerOrProvider: signer,
  });

  const marketProvider = useContract({
    contractInterface: marketContract.abi,
    addressOrName: addresses.Market,
    signerOrProvider: provider,
  });

  async function updateMaxAmount() {
    const reserveAddress = await marketProvider.getReserveAddress(
      addresses[props.asset].address
    );

    const reserve = new ethers.Contract(
      reserveAddress,
      reserveContract.abi,
      provider
    );

    const updatedMaxAmount = await reserve.getMaximumWithdrawalAmount(address);

    console.log("Updated Max Withdrawal Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount);
  }

  useEffect(() => {
    if (isConnected && props.asset) {
      updateMaxAmount();
    }
  }, [isConnected, props.asset]);

  const handleWithdrawalSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    updateMaxAmount();
    dispatch({
      type: "success",
      message: "Tokens are now back in your wallet.",
      title: "Withdrawal Successful! ",
      position: "topR",
    });
  };

  function handleInputChange(e) {
    if (e.target.value != "") {
      setAmount(
        parseUnits(e.target.value, addresses[props.asset].decimals).toString()
      );
    } else {
      setAmount("0");
    }
  }

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Maximum withdrawal amount</Typography>
          <Typography variant="body16">
            {formatUnits(maxAmount, addresses[props.asset].decimals) +
              " " +
              props.asset}
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center mx-8 mt-12 mb-2">
        <Input
          label="Amount"
          type="number"
          step="any"
          value={amount && formatUnits(amount, addresses[props.asset].decimals)}
          validation={{
            numberMax: Number(
              formatUnits(maxAmount, addresses[props.asset].decimals)
            ),
            numberMin: 0,
          }}
          onChange={handleInputChange}
        />
      </div>
      <div className="flex flex-row justify-center">
        <div className="flex flex-col">
          <Button
            onClick={() =>
              setAmount(BigNumber.from(maxAmount).mul(2500).div(10000))
            }
            text="25%"
            theme="outline"
          />
        </div>
        <div className="flex flex-col">
          <Button
            onClick={() =>
              setAmount(BigNumber.from(maxAmount).mul(5000).div(10000))
            }
            text="50%"
            theme="outline"
          />
        </div>
        <div className="flex flex-col">
          <Button
            onClick={() =>
              setAmount(BigNumber.from(maxAmount).mul(7500).div(10000))
            }
            text="75%"
            theme="outline"
          />
        </div>
        <div className="flex flex-col">
          <Button
            onClick={() => setAmount(maxAmount)}
            text="100%"
            theme="outline"
          />
        </div>
      </div>
      <div className="mt-16 mb-8">
        <Button
          text="Withdraw"
          theme="secondary"
          isFullWidth
          loadingProps={{
            spinnerColor: "#000000",
            spinnerType: "loader",
            direction: "right",
            size: "24",
          }}
          loadingText=""
          isLoading={withdrawalLoading}
          onClick={async function () {
            if (BigNumber.from(amount).lte(BigNumber.from(maxAmount))) {
              try {
                setWithdrawalLoading(true);
                const tx = await marketSigner.withdraw(
                  addresses[props.asset].address,
                  amount
                );
                await tx.wait(1);
                handleWithdrawalSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setWithdrawalLoading(false);
              }
            } else {
              dispatch({
                type: "error",
                message: "Amount is bigger than max permited withdrawal",
                title: "Error",
                position: "topR",
              });
            }
          }}
        />
      </div>
    </div>
  );
}
