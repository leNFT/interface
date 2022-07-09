import contractAddresses from "../contractAddresses.json";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import styles from "../styles/Home.module.css";
import { useNotification, Button, Input, Illustration } from "web3uikit";
import marketContract from "../contracts/Market.json";
import nftOracleContract from "../contracts/NFTOracle.json";
import "bignumber.js";
import erc721 from "../contracts/erc721.json";
import Image from "next/image";

export default function Borrow(props) {
  const [amount, setAmount] = useState("0");
  const [maxAmount, setMaxAmount] = useState("0");
  const [approved, setApproved] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const { isWeb3Enabled, chainId } = useMoralis();
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const dispatch = useNotification();

  const { runContractFunction: getApproval } = useWeb3Contract();
  const { runContractFunction: approve } = useWeb3Contract();

  const { runContractFunction: borrow } = useWeb3Contract({
    abi: marketContract.abi,
    contractAddress: addresses.Market,
    functionName: "borrow",
    params: {
      asset: addresses.wETH,
      amount: amount,
      nftAddress: props.token_address,
      nftTokenID: props.token_id,
    },
  });

  const { runContractFunction: getMaxCollateralization } = useWeb3Contract({
    abi: nftOracleContract.abi,
    contractAddress: addresses.NFTOracle,
    functionName: "getCollectionMaxCollateralization",
    params: {
      collection: props.token_address,
    },
  });

  async function getTokenApproval() {
    const getApprovalOptions = {
      abi: erc721,
      contractAddress: props.token_address,
      functionName: "getApproved",
      params: {
        tokenId: props.token_id,
      },
    };

    const approval = await getApproval({
      onError: (error) => console.log(error),
      params: getApprovalOptions,
    });

    setApproved(approval == addresses.Market);
  }

  async function updateMaxAmount() {
    const updatedMaxAmount = await getMaxCollateralization();
    console.log("Updated Max Borrow Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount.toString());
  }

  //Run once
  useEffect(() => {
    if (isWeb3Enabled) {
      getTokenApproval();
      updateMaxAmount();
    }
  }, [isWeb3Enabled, props.token_id]);

  const handleBorrowSuccess = async function () {
    props.setVisibility(false);
    dispatch({
      type: "info",
      message: "Loan Created!",
      title: "Notification",
      position: "topR",
      icon: "bell",
    });
  };

  const handleApprovalSuccess = async function () {
    setApproved(true);
    dispatch({
      type: "info",
      message: "Approval Successful!",
      title: "Notification",
      position: "topR",
      icon: "bell",
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
      {props.token_uri ? (
        <div className="flex flex-col items-center">
          <Image
            loader={() => props.token_uri}
            src={props.token_uri}
            height="200"
            width="200"
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <Illustration height="180px" logo="token" width="100%" />
          Loading...
        </div>
      )}
      <div className="flex flex-row items-center justify-center m-2">
        Address is {props.token_address}
      </div>
      <div className="flex flex-row items-center justify-center m-2">
        Asset ID is {props.token_id}
      </div>
      <div className="flex flex-row items-center justify-center m-2">
        Maximum borrowable amount is {formatUnits(maxAmount, 18)} WETH
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        <Input
          label="Amount"
          type="number"
          disabled={!approved}
          onChange={handleInputChange}
        />
      </div>
      {approved ? (
        <div className="flex m-8">
          <Button
            text="Create Loan"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
            }}
            loadingText="Creating Loan"
            isLoading={borrowLoading}
            onClick={async function () {
              if (BigNumber.from(amount).lte(BigNumber.from(maxAmount))) {
                setBorrowLoading(true);
                await borrow({
                  onComplete: () => setBorrowLoading(false),
                  onSuccess: handleBorrowSuccess,
                  onError: (error) => console.log(error),
                });
              } else {
                dispatch({
                  type: "info",
                  message: "Amount too big!",
                  title: "Notification",
                  position: "topR",
                  icon: "bell",
                });
              }
            }}
          />
        </div>
      ) : (
        <div className="flex m-8">
          <Button
            text="Approve Asset"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
            }}
            loadingText="Approving Asset"
            isLoading={approvalLoading}
            onClick={async function () {
              setApprovalLoading(true);
              const approveOptions = {
                abi: erc721,
                contractAddress: props.token_address,
                functionName: "approve",
                params: {
                  to: addresses.Market,
                  tokenId: props.token_id,
                },
              };

              await approve({
                onComplete: setApprovalLoading(false),
                onSuccess: handleApprovalSuccess,
                onError: (error) => console.log(error),
                params: approveOptions,
              });
            }}
          />
        </div>
      )}
    </div>
  );
}
