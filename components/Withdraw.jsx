import { useNotification } from "@web3uikit/core";
import { BigNumber } from "@ethersproject/bignumber";
import styles from "../styles/Home.module.css";
import { Button, Input, Typography } from "@web3uikit/core";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { ethers } from "ethers";
import reserveContract from "../contracts/Reserve.json";
import contractAddresses from "../contractAddresses.json";
import { useState, useEffect } from "react";
import lendingMarketContract from "../contracts/LendingMarket.json";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";

export default function Withdraw(props) {
  const [withdrawalLoading, setWithdrawalLoading] = useState(false);
  const [amount, setAmount] = useState("0");
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

  const lendingMarketSigner = useContract({
    contractInterface: lendingMarketContract.abi,
    addressOrName: addresses.LendingMarket,
    signerOrProvider: signer,
  });

  async function updateMaxAmount() {
    const reserve = new ethers.Contract(
      props.reserve,
      reserveContract.abi,
      provider
    );

    const updatedMaxAmount = await reserve.maxWithdraw(address);

    console.log("Updated Max Withdrawal Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount);
  }

  useEffect(() => {
    if (props.reserve && props.asset) {
      console.log("Got reserve address, setting the rest...", props.reserve);
      console.log(" props.asset", props.asset);
      updateMaxAmount();
    }
  }, [props.reserve, props.asset]);

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
      setAmount(parseUnits(e.target.value, 18).toString());
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
            {formatUnits(maxAmount, 18) + " " + props.assetSymbol}
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center mx-8 mt-12 mb-2">
        <Input
          label="Amount"
          type="number"
          step="any"
          value={amount && formatUnits(amount, 18)}
          validation={{
            numberMax: Number(formatUnits(maxAmount, 18)),
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
      <div className="m-8">
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
                var tx;
                if (props.assetSymbol == "ETH") {
                  console.log("Withdrawal ETH");
                  tx = await lendingMarketSigner.withdrawETH(
                    props.reserve,
                    amount
                  );
                } else {
                  tx = await lendingMarketSigner.withdraw(
                    props.reserve,
                    amount
                  );
                }
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
