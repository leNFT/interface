import contractAddresses from "../../contractAddresses.json";
import { getAssetPrice } from "../../helpers/getAssetPrice.js";
import { getNewRequestID } from "../../helpers/getNewRequestID.js";
import { getAddressNFTs } from "../../helpers/getAddressNFTs.js";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import loanCenterContract from "../../contracts/LoanCenter.json";
import { useState, useEffect } from "react";
import styles from "../../styles/Home.module.css";
import {
  useNotification,
  Button,
  Input,
  Typography,
  Loading,
} from "@web3uikit/core";

import tokenOracleContract from "../../contracts/TokenOracle.json";
import lendingPoolContract from "../../contracts/LendingPool.json";
import genesisNFTContract from "../../contracts/GenesisNFT.json";
import lendingMarketContract from "../../contracts/LendingMarket.json";
import erc721 from "../../contracts/erc721.json";
import Image from "next/image";
import { Divider, Switch } from "@mui/material";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import wethGatewayContract from "../../contracts/WETHGateway.json";
import { ethers } from "ethers";

export default function Borrow(props) {
  const PRICE_PRECISION = "1000000000000000000";
  const [genesisNFTId, setGenesisNFTId] = useState(0);
  const [genesisBoost, setGenesisBoost] = useState(false);
  const [loadingGenesisBoost, setLoadingGenesisBoost] = useState(false);
  const [amount, setAmount] = useState("0");
  const [maxAmount, setMaxAmount] = useState("0");
  const [tokenPrice, setTokenPrice] = useState("0");
  const [maxCollateralization, setMaxCollateralization] = useState(0);
  const [collateralizationBoost, setCollateralizationBoost] = useState(0);
  const [nftApproved, setNFTApproved] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [loadingMaxAmount, setLoadingMaxAmount] = useState(false);
  const [loadingBorrowRate, setLoadingBorrowRate] = useState(false);
  const [lendingPoolAddress, setLendingPoolAddress] = useState("");
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [borrowRate, setBorrowRate] = useState(0);
  const { address, isConnected } = useAccount();
  const { data: signer } = useSigner();
  const { chain } = useNetwork();
  const provider = useProvider();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const dispatch = useNotification();
  const [borrowAsset, setBorrowAsset] = useState("ETH");

  const wethGatewaySigner = useContract({
    contractInterface: wethGatewayContract.abi,
    addressOrName: addresses.WETHGateway,
    signerOrProvider: signer,
  });

  const nftSigner = useContract({
    contractInterface: erc721,
    addressOrName: props.token_address,
    signerOrProvider: signer,
  });

  const nftProvider = useContract({
    contractInterface: erc721,
    addressOrName: props.token_address,
    signerOrProvider: provider,
  });

  const tokenOracle = useContract({
    contractInterface: tokenOracleContract.abi,
    addressOrName: addresses.TokenOracle,
    signerOrProvider: provider,
  });

  const loanCenter = useContract({
    contractInterface: loanCenterContract.abi,
    addressOrName: addresses.LoanCenter,
    signerOrProvider: provider,
  });

  const lendingMarketSigner = useContract({
    contractInterface: lendingMarketContract.abi,
    addressOrName: addresses.LendingMarket,
    signerOrProvider: signer,
  });

  const lendingMarketProvider = useContract({
    contractInterface: lendingMarketContract.abi,
    addressOrName: addresses.LendingMarket,
    signerOrProvider: provider,
  });

  const lendingPool = useContract({
    contractInterface: lendingPoolContract.abi,
    addressOrName: lendingPoolAddress,
    signerOrProvider: provider,
  });

  const genesisNFTProvider = useContract({
    contractInterface: genesisNFTContract.abi,
    addressOrName: addresses.GenesisNFT,
    signerOrProvider: provider,
  });

  async function getLendingPool() {
    const updatedLendingPoolAddress =
      await lendingMarketProvider.getLendingPool(
        props.token_address,
        addresses[borrowAsset].address
      );
    setLendingPoolAddress(updatedLendingPoolAddress);
    console.log("updatedLendingPoolAddress", updatedLendingPoolAddress);
  }

  async function getGenesisNFT() {
    // GEt user genesis NFTs
    const userGenesisNFTs = await getAddressNFTs(
      address,
      addresses.GenesisNFT,
      chain.id
    );
    console.log("Got Genesis NFTs", userGenesisNFTs);

    //Find an NFT that's not being used by a loan
    for (let i = 0; i < userGenesisNFTs.length; i++) {
      const id = Number(userGenesisNFTs[i].id.tokenId);
      const activeState = await genesisNFTProvider.getActiveState(id);
      console.log("Active state for " + id + " is " + activeState);
      if (activeState == false) {
        console.log("Using token ID for boost", id);
        setGenesisNFTId(id);
        break;
      }
    }
  }

  async function getNFTApproval() {
    const approvedAddress = await nftProvider.getApproved(props.token_id);
    setNFTApproved(
      approvedAddress ==
        (borrowAsset == "ETH" ? addresses.WETHGateway : addresses.LendingMarket)
    );
  }

  async function updateLendingPoolBorrowRate() {
    const updatedBorrowRate = (await lendingPool.getBorrowRate()).toNumber();

    setBorrowRate(updatedBorrowRate);
    setLoadingBorrowRate(false);
  }

  async function updateMaxBorrowAmount() {
    // Get token price
    const priceResponse = await getAssetPrice(
      props.token_address,
      props.token_id,
      chain.id
    );
    setTokenPrice(priceResponse.price);
    console.log("price", priceResponse.price);

    //Get token max collateralization
    const updatedMaxCollateralization =
      await loanCenter.getCollectionMaxCollaterization(props.token_address);
    console.log("maxCollateralization updated", updatedMaxCollateralization);
    setMaxCollateralization(updatedMaxCollateralization);

    //Get genesis boost
    var genesisBoostAmount = "0";
    console.log("updatemaxamountgenesisBoost", genesisBoost);
    if (genesisBoost) {
      genesisBoostAmount = await genesisNFTProvider.getLTVBoost();
    }
    setCollateralizationBoost(genesisBoostAmount);

    // Get max amount borrowable
    const tokenETHPrice = (
      await tokenOracle.getTokenETHPrice(addresses[borrowAsset].address)
    ).toString();
    console.log("tokenETHPrice", tokenETHPrice);
    const maxCollateralization = BigNumber.from(updatedMaxCollateralization)
      .add(genesisBoostAmount)
      .mul(priceResponse.price)
      .div(10000)
      .mul(tokenETHPrice)
      .div(PRICE_PRECISION)
      .div(2)
      .toString();
    console.log("maxCollateralization", maxCollateralization);
    const lendingPoolUnderlying = (
      await lendingPool.getUnderlyingBalance()
    ).toString();
    console.log("lendingPoolUnderlying", lendingPoolUnderlying);
    const updatedMaxAmount = BigNumber.from(maxCollateralization).gt(
      BigNumber.from(lendingPoolUnderlying)
    )
      ? lendingPoolUnderlying
      : maxCollateralization;
    console.log("Updated Max Borrow Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount);
    setLoadingMaxAmount(false);
    setLoadingGenesisBoost(false);
  }

  useEffect(() => {
    if (lendingPoolAddress) {
      getNFTApproval();
      updateMaxBorrowAmount();
      updateLendingPoolBorrowRate();
    }
  }, [lendingPoolAddress, props.token_id]);

  useEffect(() => {
    if (lendingPoolAddress) {
      updateMaxBorrowAmount();
    }
  }, [genesisBoost]);

  useEffect(() => {
    if (isConnected) {
      console.log("wethGateway", addresses.WETHGateway);
      setLoadingMaxAmount(true);
      setLoadingBorrowRate(true);
      getLendingPool();
      getGenesisNFT();
    }
  }, [isConnected, borrowAsset]);

  const handleBorrowSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Newly created loans can take up to 5 minutes to appear.",
      title: "Loan Created!",
      position: "bottomL",
    });
  };

  const handleNFTApprovalSuccess = async function () {
    setNFTApproved(true);
    dispatch({
      type: "success",
      message: "You can now borrow using this asset.",
      title: "Approval Successful!",
      position: "bottomL",
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

  const handleGenesisSwitchChange = (event) => {
    setLoadingGenesisBoost(true);
    console.log("Changed Genesis Switch", event.target.checked);
    setGenesisBoost(event.target.checked);
  };

  return (
    <div className={styles.container}>
      <div className="flex flex-col justify-center items-center">
        <div className="flex flex-col lg:m-8 xl:flex-row justify-center">
          <div className="flex flex-col items-center justify-center mb-4 lg:m-8">
            {props.token_image ? (
              <Image
                loader={() => props.token_image}
                src={props.token_image}
                height="300"
                width="300"
                loading="eager"
                className="rounded-3xl"
              />
            ) : (
              <div className="flex items-center justify-center w-[300px] h-[300px]">
                Image Unavailable
              </div>
            )}
            {genesisNFTId != 0 && (
              <div className="flex flex-row justify-center items-center">
                <Typography variant="caption14">Genesis NFT Boost: </Typography>
                {loadingGenesisBoost ? (
                  <div className="m-3">
                    <Loading size={18} spinnerColor="#000000" />
                  </div>
                ) : (
                  <Switch
                    checked={genesisBoost}
                    onChange={handleGenesisSwitchChange}
                  />
                )}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <div className="flex flex-row m-2">
              <div className="flex flex-col">
                <Typography variant="subtitle2">NFT Address</Typography>
                <Typography variant="caption14">
                  <p className="break-all">{props.token_address}</p>
                </Typography>
              </div>
            </div>
            <div className="flex flex-row m-2">
              <div className="flex flex-col">
                <Typography variant="subtitle2">Token ID</Typography>
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
                    {tokenPrice != "0"
                      ? formatUnits(tokenPrice, 18) + " " + borrowAsset
                      : "Token Price Appraisal Error"}
                  </Typography>
                )}
              </div>
            </div>
            <div className="flex flex-row m-2">
              <div className="flex flex-col">
                <Typography variant="subtitle2">Max LTV (+ Boost)</Typography>
                {loadingMaxAmount ? (
                  <div className="m-2">
                    <Loading size={14} spinnerColor="#000000" />
                  </div>
                ) : (
                  <Typography variant="body16">
                    {tokenPrice != "0"
                      ? maxCollateralization / 100 +
                        "% + " +
                        collateralizationBoost / 100 +
                        "% = " +
                        (parseInt(maxCollateralization) +
                          parseInt(collateralizationBoost)) /
                          100 +
                        "%"
                      : "Token Price Appraisal Error"}
                  </Typography>
                )}
              </div>
            </div>
            <div className="flex flex-row items-center m-2">
              <div className="flex flex-col">
                <Typography variant="subtitle2">
                  Liquidation Threshold
                </Typography>
                <Typography variant="caption16">
                  {formatUnits(
                    BigNumber.from(maxCollateralization)
                      .add(collateralizationBoost)
                      .mul(tokenPrice)
                      .div(10000)
                      .toString(),
                    18
                  ) +
                    " " +
                    borrowAsset}
                </Typography>
              </div>
            </div>
          </div>
        </div>
        <div className="m-8 lg:hidden">
          <Divider />
        </div>
        <div className="flex flex-col m-2 border-2 rounded-3xl max-w-max items-center p-2">
          <div className="flex flex-row m-2">
            <div className="flex flex-col items-center">
              <Typography variant="subtitle1">
                Maximum borrowable amount
              </Typography>
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
            <div className="flex flex-col items-center">
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
            disabled={!nftApproved}
            onChange={handleInputChange}
          />
        </div>
        {nftApproved ? (
          <div className="flex min-w-full m-8 mt-2">
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
                  try {
                    setBorrowLoading(true);
                    // Get updated price trusted server signature from server
                    const requestID = getNewRequestID();
                    const priceSig = await getAssetPrice(
                      props.token_address,
                      props.token_id,
                      chain.id,
                      requestID
                    );
                    var tx;
                    if (borrowAsset == "ETH") {
                      console.log("request", requestID);
                      console.log("priceSig", priceSig);
                      console.log("amount", amount);
                      console.log("props.token_address", props.token_address);
                      console.log("props.token_id", props.token_id);
                      console.log("genesisNFTId", genesisNFTId);
                      console.log("wethGatewaySigner", wethGatewaySigner);
                      tx = await wethGatewaySigner.borrowETH(
                        amount,
                        props.token_address,
                        props.token_id,
                        genesisNFTId,
                        requestID,
                        priceSig.sig
                      );
                      await tx.wait(1);
                    } else {
                      console.log("Borrowing ERC20");
                      tx = await marketSigner.borrow(
                        addresses[borrowAsset].address,
                        amount,
                        props.token_address,
                        props.token_id,
                        genesisNFTId,
                        requestID,
                        priceSig.sig
                      );
                      await tx.wait(1);
                    }
                    handleBorrowSuccess();
                  } catch (error) {
                    console.log(error);
                  } finally {
                    setBorrowLoading(false);
                  }
                } else {
                  dispatch({
                    type: "error",
                    message: "Amount too big!",
                    title: "Error",
                    position: "bottomL",
                    icon: "bell",
                  });
                }
              }}
            />
          </div>
        ) : (
          <div className="flex min-w-full m-8 mt-2">
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
                try {
                  setApprovalLoading(true);
                  console.log("borrowAsset", borrowAsset);
                  const tx = await nftSigner.approve(
                    borrowAsset == "ETH"
                      ? addresses.WETHGateway
                      : addresses.LendingMarket,
                    props.token_id
                  );
                  await tx.wait(1);
                  handleNFTApprovalSuccess();
                } catch (error) {
                  console.log(error);
                } finally {
                  setApprovalLoading(false);
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
