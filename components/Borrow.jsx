import contractAddresses from "../contractAddresses.json";
import {
  getTokenPriceSig,
  getNewRequestID,
} from "../helpers/getTokenPriceSig.js";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import styles from "../styles/Home.module.css";
import {
  Icon,
  useNotification,
  Button,
  Input,
  Illustration,
  Typography,
} from "web3uikit";
import marketContract from "../contracts/Market.json";
import nftOracleContract from "../contracts/NFTOracle.json";
import tokenOracleContract from "../contracts/TokenOracle.json";
import reserveContract from "../contracts/Reserve.json";
import "bignumber.js";
import erc721 from "../contracts/erc721.json";
import Image from "next/image";
import { Tab, Tabs } from "grommet";

export default function Borrow(props) {
  const PRICE_PRECISION = "1000000000000000000";
  const [amount, setAmount] = useState("0");
  const [maxAmount, setMaxAmount] = useState("0");
  const [approved, setApproved] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [reserveAddress, setReserveAddress] = useState("");
  const [borrowLoading, setBorrowLoading] = useState(false);
  const { isWeb3Enabled, chainId, account } = useMoralis();
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const dispatch = useNotification();
  const [borrowAsset, setBorrowAsset] = useState("WETH");

  const { runContractFunction: getApproval } = useWeb3Contract();
  const { runContractFunction: approve } = useWeb3Contract();

  const { runContractFunction: borrow } = useWeb3Contract();

  const { runContractFunction: getTokenMaxETHCollateral } = useWeb3Contract();

  const { runContractFunction: getTokenETHPrice } = useWeb3Contract({
    abi: tokenOracleContract.abi,
    contractAddress: addresses.TokenOracle,
    functionName: "getTokenETHPrice",
    params: {
      tokenAddress: addresses[borrowAsset].address,
    },
  });

  const { runContractFunction: getReserveAddress } = useWeb3Contract({
    abi: marketContract.abi,
    contractAddress: addresses.Market,
    functionName: "getReserveAddress",
    params: {
      asset: addresses[borrowAsset].address,
    },
  });

  const { runContractFunction: getUnderlyingBalance } = useWeb3Contract({
    abi: reserveContract.abi,
    contractAddress: reserveAddress,
    functionName: "getUnderlyingBalance",
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

  async function updateMaxBorrowAmount() {
    const tokenETHPrice = (await getTokenETHPrice()).toString();
    console.log("tokenETHPrice", tokenETHPrice);
    // Get updated price trusted server signature from server
    const requestID = getNewRequestID();
    const priceSig = await getTokenPriceSig(
      requestID,
      props.token_address,
      props.token_id
    );

    const tokenMaxETHCollateralOptions = {
      abi: nftOracleContract.abi,
      contractAddress: addresses.NFTOracle,
      functionName: "getTokenMaxETHCollateral",
      params: {
        user: account,
        collection: props.token_address,
        tokenId: props.token_id,
        request: requestID,
        packet: priceSig,
      },
    };
    const liquidationCollateral = await getTokenMaxETHCollateral({
      onError: (error) => console.log(error),
      params: tokenMaxETHCollateralOptions,
    });
    console.log("liquidationCollateral", liquidationCollateral.toString());
    const maxETHCollateral = liquidationCollateral.div(2).toString();
    console.log("maxETHCollateral", maxETHCollateral);
    const maxCollateral = BigNumber.from(maxETHCollateral)
      .mul(tokenETHPrice)
      .div(PRICE_PRECISION)
      .toString();
    console.log("maxCollateral", maxCollateral);
    const reserveUnderlying = (await getUnderlyingBalance()).toString();
    console.log("reserveUnderlying", reserveUnderlying);
    const updatedMaxAmount = BigNumber.from(maxCollateral).gt(
      BigNumber.from(reserveUnderlying)
    )
      ? reserveUnderlying
      : maxCollateral;
    console.log("Updated Max Borrow Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount);
  }

  useEffect(() => {
    if (reserveAddress) {
      getTokenApproval();
      updateMaxBorrowAmount();
    }
  }, [reserveAddress, props.token_id]);

  useEffect(() => {
    if (isWeb3Enabled) {
      console.log("Getting reserve", addresses[borrowAsset].address);
      getReserve();
    }
  }, [isWeb3Enabled, borrowAsset]);

  const handleBorrowSuccess = async function () {
    props.setVisibility(false);
    dispatch({
      type: "info",
      message: "Loan Created! Please wait for transaction confirmation.",
      title: "Notification",
      position: "topR",
      icon: "bell",
    });
  };

  const handleApprovalSuccess = async function () {
    setApproved(true);
    dispatch({
      type: "info",
      message:
        "Approval Successful! Please wait for tx confirmation to borrow.",
      title: "Notification",
      position: "topR",
      icon: "bell",
    });
  };

  function handleInputChange(e) {
    if (e.target.value != "") {
      setAmount(
        parseUnits(e.target.value, addresses[borrowAsset].decimals).toString()
      );
    } else {
      setAmount("0");
    }
  }

  const onActive = (nextIndex) => {
    if (nextIndex == "0") {
      setBorrowAsset("WETH");
    } else if (nextIndex == "1") {
      setBorrowAsset("USDC");
    }
  };

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
      <div className="flex flex-row m-8 items-center">
        <Tabs flex="grow" alignSelf="center" onActive={onActive}>
          <Tab
            title="WETH"
            icon={<Icon fill="#68738D" size={20} svg="eth" />}
          />
          <Tab
            title="USDC"
            icon={<Icon fill="#68738D" size={20} svg="usdc" />}
          />
        </Tabs>
      </div>
      <div className="flex flex-row m-2">
        <div className="flex flex-col">
          <Typography variant="h4">Address</Typography>
          <Typography variant="caption14">{props.token_address}</Typography>
        </div>
      </div>
      <div className="flex flex-row m-2">
        <div className="flex flex-col">
          <Typography variant="h4">Asset ID</Typography>
          <Typography variant="body16">{props.token_id}</Typography>
        </div>
      </div>
      <div className="flex flex-row m-2">
        <div className="flex flex-col">
          <Typography variant="h4">Maximum borrowable amount</Typography>
          <Typography variant="body16">
            {formatUnits(maxAmount, addresses[borrowAsset].decimals) +
              " " +
              borrowAsset}
          </Typography>
        </div>
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        <Input
          label="Amount"
          type="number"
          step="any"
          validation={{
            numberMax: Number(
              formatUnits(maxAmount, addresses[borrowAsset].decimals)
            ),
            numberMin: 0,
          }}
          disabled={!approved}
          onChange={handleInputChange}
        />
      </div>
      {approved ? (
        <div className="mt-16 mb-8">
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
                // Get updated price trusted server signature from server
                const requestID = getNewRequestID();
                const priceSig = await getTokenPriceSig(
                  requestID,
                  props.token_address,
                  props.token_id
                );
                console.log("Got price sig", priceSig);
                const borrowOptions = {
                  abi: marketContract.abi,
                  contractAddress: addresses.Market,
                  functionName: "borrow",
                  params: {
                    asset: addresses[borrowAsset].address,
                    amount: amount,
                    nftAddress: props.token_address,
                    nftTokenID: props.token_id,
                    request: requestID,
                    packet: priceSig,
                  },
                };
                await borrow({
                  onComplete: () => setBorrowLoading(false),
                  onSuccess: handleBorrowSuccess,
                  onError: (error) => console.log(error),
                  params: borrowOptions,
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
        <div className="flex mt-16 mb-8">
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
