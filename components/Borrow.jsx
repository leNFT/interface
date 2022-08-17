import contractAddresses from "../contractAddresses.json";
import {
  getTokenPriceSig,
  getNewRequestID,
} from "../helpers/getTokenPriceSig.js";
import { getTokenPrice } from "../helpers/getTokenPrice.js";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import styles from "../styles/Home.module.css";
import { Eth, Usdc } from "@web3uikit/icons";
import {
  useNotification,
  Button,
  Input,
  Illustration,
  Typography,
  Loading,
} from "@web3uikit/core";
import marketContract from "../contracts/Market.json";
import nftOracleContract from "../contracts/NFTOracle.json";
import tokenOracleContract from "../contracts/TokenOracle.json";
import reserveContract from "../contracts/Reserve.json";
import "bignumber.js";
import erc721 from "../contracts/erc721.json";
import Image from "next/image";
import { TabList, Tab } from "@web3uikit/core";
import { Divider } from "@mui/material";

export default function Borrow(props) {
  const PRICE_PRECISION = "1000000000000000000";
  const [amount, setAmount] = useState("0");
  const [maxAmount, setMaxAmount] = useState("0");
  const [tokenPrice, setTokenPrice] = useState("0");
  const [tokenMaxCollateralization, setTokenMaxCollateralization] = useState(0);
  const [approved, setApproved] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [loadingMaxAmount, setLoadingMaxAmount] = useState(false);
  const [loadingBorrowRate, setLoadingBorrowRate] = useState(false);
  const [reserveAddress, setReserveAddress] = useState("");
  const [borrowLoading, setBorrowLoading] = useState(false);
  const { isWeb3Enabled, chainId } = useMoralis();
  const [borrowRate, setBorrowRate] = useState(0);
  const addresses =
    chainId in contractAddresses
      ? contractAddresses[chainId]
      : contractAddresses["0x1"];

  const dispatch = useNotification();
  const [borrowAsset, setBorrowAsset] = useState("WETH");

  const { runContractFunction: getApproval } = useWeb3Contract();
  const { runContractFunction: approve } = useWeb3Contract();
  const { runContractFunction: borrow } = useWeb3Contract();
  const { runContractFunction: getBorrowRate } = useWeb3Contract();

  const { runContractFunction: getTokenETHPrice } = useWeb3Contract({
    abi: tokenOracleContract.abi,
    contractAddress: addresses.TokenOracle,
    functionName: "getTokenETHPrice",
    params: {
      token: addresses[borrowAsset].address,
    },
  });

  const { runContractFunction: getCollectionMaxCollateralization } =
    useWeb3Contract({
      abi: nftOracleContract.abi,
      contractAddress: addresses.NFTOracle,
      functionName: "getCollectionMaxCollaterization",
      params: {
        collection: props.token_address,
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

  async function updateReserveBorrowRate() {
    const getBorrowRateOptions = {
      abi: reserveContract.abi,
      contractAddress: reserveAddress,
      functionName: "getBorrowRate",
      params: {},
    };

    const updatedBorrowRate = (
      await getBorrowRate({
        onError: (error) => console.log(error),
        params: getBorrowRateOptions,
      })
    ).toNumber();

    setBorrowRate(updatedBorrowRate);
    setLoadingBorrowRate(false);
  }

  async function updateMaxBorrowAmount() {
    // Get token price
    const price = await getTokenPrice(props.token_address, props.token_id);
    setTokenPrice(price);

    //Get token max collateralization
    const maxCollateralization = (
      await getCollectionMaxCollateralization()
    ).toString();
    console.log("maxCollateralization updated", maxCollateralization);
    setTokenMaxCollateralization(maxCollateralization);

    // Get max amount borrowable
    const tokenETHPrice = (await getTokenETHPrice()).toString();
    console.log("tokenETHPrice", tokenETHPrice);

    const maxETHCollateral = BigNumber.from(price)
      .mul(maxCollateralization)
      .div(10000)
      .div(2)
      .toString();
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
    setLoadingMaxAmount(false);
  }

  useEffect(() => {
    if (reserveAddress) {
      getTokenApproval();
      updateMaxBorrowAmount();
      updateReserveBorrowRate();
    }
  }, [reserveAddress, props.token_id]);

  useEffect(() => {
    if (isWeb3Enabled) {
      setLoadingMaxAmount(true);
      setLoadingBorrowRate(true);
      console.log("Getting reserve", addresses[borrowAsset].address);
      getReserve();
    }
  }, [isWeb3Enabled, borrowAsset]);

  const handleBorrowSuccess = async function () {
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Please wait for transaction confirmation.",
      title: "Loan Created!",
      position: "topR",
    });
  };

  const handleApprovalSuccess = async function () {
    setApproved(true);
    setApprovalLoading(false);
    dispatch({
      type: "success",
      message: "Please wait for tx confirmation to borrow.",
      title: "Approval Successful!",
      position: "topR",
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

  const onTabChange = (selectedKey) => {
    if (selectedKey == "0") {
      setBorrowAsset("WETH");
    } else if (selectedKey == "1") {
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
            unoptimized={true}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1">
          <Illustration height="180px" logo="token" width="100%" />
          Loading...
        </div>
      )}
      <div className="flex flex-row m-8 items-center justify-center">
        <TabList
          isWidthAuto
          defaultActiveKey={0}
          onChange={onTabChange}
          tabStyle="bulbSeperate"
        >
          <Tab
            lineHeight={0}
            tabKey={0}
            tabName={<Eth fontSize="32px" color="#000000" />}
          ></Tab>
        </TabList>
      </div>
      <div className="flex flex-row m-2">
        <div className="flex flex-col">
          <Typography variant="subtitle1">Maximum borrowable amount</Typography>
          {loadingMaxAmount ? (
            <div className="m-2">
              <Loading size={16} spinnerColor="#000000" />
            </div>
          ) : (
            <Typography variant="body18">
              {formatUnits(maxAmount, addresses[borrowAsset].decimals) +
                " " +
                borrowAsset}
            </Typography>
          )}
        </div>
      </div>
      <div className="flex flex-row m-2">
        <div className="flex flex-col">
          <Typography variant="subtitle1">Interest Rate</Typography>
          {loadingBorrowRate ? (
            <div className="m-2">
              <Loading size={16} spinnerColor="#000000" />
            </div>
          ) : (
            <Typography variant="body18">{borrowRate / 100}%</Typography>
          )}
        </div>
      </div>
      <div className="m-8">
        <Divider />
      </div>

      <div className="flex flex-row m-2">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Address</Typography>
          <Typography variant="body16">{props.token_address}</Typography>
        </div>
      </div>
      <div className="flex flex-row m-2">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Asset ID</Typography>
          <Typography variant="body16">{props.token_id}</Typography>
        </div>
      </div>
      <div className="flex flex-row m-2">
        <div className="flex flex-col">
          <Typography variant="subtitle2">Asset Pricing</Typography>
          {loadingMaxAmount ? (
            <div className="m-2">
              <Loading size={14} spinnerColor="#000000" />
            </div>
          ) : (
            <Typography variant="body16">
              {formatUnits(tokenPrice, 18) +
                " WETH @ " +
                tokenMaxCollateralization / 100 +
                "% Max LTV"}
            </Typography>
          )}
        </div>
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        <Input
          labelBgColor="rgb(241, 242, 251)"
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
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            isLoading={borrowLoading}
            onClick={async function () {
              if (BigNumber.from(amount).lte(BigNumber.from(maxAmount))) {
                setBorrowLoading(true);
                // Get updated price trusted server signature from server
                const requestID = getNewRequestID();
                const priceSig = await getTokenPriceSig(
                  requestID,
                  props.token_address,
                  props.token_id,
                  chainId
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
                  type: "error",
                  message: "Amount too big!",
                  title: "Error",
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
