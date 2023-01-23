import {
  useAccount,
  useBalance,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import Box from "@mui/material/Box";
import { BigNumber } from "@ethersproject/bignumber";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { CardActionArea } from "@mui/material";
import { getAddressNFTs } from "../../helpers/getAddressNFTs.js";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useNotification, Button } from "@web3uikit/core";
import styles from "../../styles/Home.module.css";
import contractAddresses from "../../contractAddresses.json";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import lendingGaugeContract from "../../contracts/LendingGauge.json";
import erc20 from "../../contracts/erc20.json";

export default function StakeLendingGauge(props) {
  const [userBalance, setUserBalance] = useState(false);
  const [approved, setApproved] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [stakeLoading, setStakeLoading] = useState(false);
  const dispatch = useNotification();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const lpTokenProvider = useContract({
    contractInterface: erc20,
    addressOrName: props.lpToken,
    signerOrProvider: provider,
  });

  const gaugeSigner = useContract({
    contractInterface: lendingGaugeContract.abi,
    addressOrName: props.gauge,
    signerOrProvider: signer,
  });

  async function getUserBalance() {
    // Get lp positions
    const updatedUserBalance = BigNumber.from(
      await lpTokenProvider.balanceOf(address)
    ).toString();
    setUserBalance(updatedUserBalance);
    console.log("updatedUserBalance", updatedUserBalance);
  }

  async function getAllowance() {
    const allowance = await lpTokenProvider.allowance(address, props.gauge);

    console.log("Got allowance:", allowance);

    if (!BigNumber.from(allowance).eq(BigNumber.from(0))) {
      setApproved(true);
    } else {
      setApproved(false);
    }
  }

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    if (props.lpToken && props.gauge) {
      console.log("Got trading pool address...", props.gauge);
      getAllowance();
      getUserBalance();
    }
  }, [props.lpToken, props.gauge]);

  const handleStakeSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Your LP was staked in the gauge.",
      title: "Stake Successful!",
      position: "topR",
    });
  };

  const handleApprovalSuccess = async function () {
    setApproved(true);
    dispatch({
      type: "success",
      message: "You can now stake.",
      title: "Approval Successful!",
      position: "topR",
    });
  };

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center m-8">
        {approved ? (
          <Button
            text={
              userLPs.length == 0
                ? "No LPs to stake"
                : selectedLP !== undefined
                ? "Selected LP #" + selectedLP
                : "Please select an LP to stake"
            }
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            onClick={async function () {
              setSelectingLP(!selectingLP);
            }}
          />
        ) : (
          <Button
            text="Approve LP"
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            isLoading={approvalLoading}
            onClick={async function () {
              const lpTokenSigner = new ethers.Contract(
                props.lpToken,
                erc20,
                signer
              );
              try {
                setApprovalLoading(true);
                console.log("signer.", signer);

                const tx = await lpTokenSigner.approve(
                  props.gauge,
                  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
                );
                await tx.wait(1);
                handleApprovalSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setApprovalLoading(false);
              }
            }}
          ></Button>
        )}
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        <Button
          text={"Stake LP"}
          theme="secondary"
          isFullWidth
          loadingProps={{
            spinnerColor: "#000000",
            spinnerType: "loader",
            direction: "right",
            size: "24",
          }}
          disabled={!approved}
          loadingText=""
          isLoading={stakeLoading}
          onClick={async function () {
            try {
              setStakeLoading(true);
              console.log("signer.", signer);
              const tx = await gaugeSigner.deposit(selectedLP);
              await tx.wait(1);
              handleStakeSuccess();
            } catch (error) {
              console.log(error);
            } finally {
              setStakeLoading(false);
            }
          }}
        ></Button>
      </div>
    </div>
  );
}
