import contractAddresses from "../contractAddresses.json";
import {
  getAssetPriceSig,
  getNewRequestID,
} from "../helpers/getAssetPriceSig.js";
import { getNFTs } from "../helpers/getNFTs.js";
import { getAssetPrice } from "../helpers/getAssetPrice.js";
import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useState, useEffect } from "react";
import styles from "../styles/Home.module.css";
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
import genesisNFTContract from "../contracts/GenesisNFT.json";
import erc721 from "../contracts/erc721.json";
import Image from "next/image";
import { Divider, Switch } from "@mui/material";
import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import nativeTokenVaultContract from "../contracts/NativeTokenVault.json";

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
  const [approved, setApproved] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [loadingMaxAmount, setLoadingMaxAmount] = useState(false);
  const [loadingBorrowRate, setLoadingBorrowRate] = useState(false);
  const [reserveAddress, setReserveAddress] = useState("");
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

  const nativeTokenVaultProvider = useContract({
    contractInterface: nativeTokenVaultContract.abi,
    addressOrName: addresses.NativeTokenVault,
    signerOrProvider: provider,
  });

  const assetCollectionSigner = useContract({
    contractInterface: erc721,
    addressOrName: props.token_address,
    signerOrProvider: signer,
  });

  const assetCollectionProvider = useContract({
    contractInterface: erc721,
    addressOrName: props.token_address,
    signerOrProvider: provider,
  });

  const tokenOracle = useContract({
    contractInterface: tokenOracleContract.abi,
    addressOrName: addresses.TokenOracle,
    signerOrProvider: provider,
  });

  const nftOracle = useContract({
    contractInterface: nftOracleContract.abi,
    addressOrName: addresses.NFTOracle,
    signerOrProvider: provider,
  });

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

  const reserve = useContract({
    contractInterface: reserveContract.abi,
    addressOrName: reserveAddress,
    signerOrProvider: provider,
  });

  const genesisNFTProvider = useContract({
    contractInterface: genesisNFTContract.abi,
    addressOrName: addresses.GenesisNFT,
    signerOrProvider: provider,
  });

  async function getReserve() {
    const updatedReserveAddress = await marketProvider.getReserveAddress(
      addresses[borrowAsset].address
    );
    setReserveAddress(updatedReserveAddress);
    console.log("updatedReserveAddress", updatedReserveAddress);
  }

  async function getGenesisNFT() {
    // GEt user genesis NFTs
    const userGenesisNFTs = await getNFTs(
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

  async function getTokenApproval() {
    const approval = await assetCollectionProvider.getApproved(props.token_id);
    setApproved(approval == addresses.Market);
  }

  async function updateReserveBorrowRate() {
    const updatedBorrowRate = (await reserve.getBorrowRate()).toNumber();

    setBorrowRate(updatedBorrowRate);
    setLoadingBorrowRate(false);
  }

  async function updateMaxBorrowAmount() {
    // Get token price
    const price = await getAssetPrice(props.token_address, props.token_id);
    setTokenPrice(price);
    console.log("price", price);

    //Get token max collateralization
    const updatedMaxCollateralization =
      await nftOracle.getCollectionMaxCollaterization(props.token_address);
    console.log("maxCollateralization updated", updatedMaxCollateralization);
    setMaxCollateralization(updatedMaxCollateralization);

    //Get vote collaterization boost
    const voteCollaterizationBoost =
      await nativeTokenVaultProvider.getVoteCollateralizationBoost(
        address,
        props.token_address
      );

    //Get genesis boost
    var genesisBoostAmount = "0";
    console.log("updatemaxamount genesisBoost", genesisBoost);
    if (genesisBoost) {
      genesisBoostAmount = await genesisNFTProvider.getLTVBoost();
    }

    // Update boost state variable
    const updatedCollaterizationBoost =
      voteCollaterizationBoost.add(genesisBoostAmount);
    console.log("updatedCollaterizationBoost", updatedCollaterizationBoost);
    setCollateralizationBoost(updatedCollaterizationBoost);

    // Get max amount borrowable
    const tokenETHPrice = (
      await tokenOracle.getTokenETHPrice(addresses[borrowAsset].address)
    ).toString();
    console.log("tokenETHPrice", tokenETHPrice);
    const maxCollateralization = BigNumber.from(updatedMaxCollateralization)
      .add(updatedCollaterizationBoost)
      .mul(price)
      .div(10000)
      .mul(tokenETHPrice)
      .div(PRICE_PRECISION)
      .div(2)
      .toString();
    console.log("maxCollateralization", maxCollateralization);
    const reserveUnderlying = (await reserve.getUnderlyingBalance()).toString();
    console.log("reserveUnderlying", reserveUnderlying);
    const updatedMaxAmount = BigNumber.from(maxCollateralization).gt(
      BigNumber.from(reserveUnderlying)
    )
      ? reserveUnderlying
      : maxCollateralization;
    console.log("Updated Max Borrow Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount);
    setLoadingMaxAmount(false);
    setLoadingGenesisBoost(false);
  }

  useEffect(() => {
    if (reserveAddress) {
      getTokenApproval();
      updateMaxBorrowAmount();
      updateReserveBorrowRate();
    }
  }, [reserveAddress, props.token_id]);

  useEffect(() => {
    updateMaxBorrowAmount();
  }, [genesisBoost]);

  useEffect(() => {
    if (isConnected) {
      setLoadingMaxAmount(true);
      setLoadingBorrowRate(true);
      console.log("Getting reserve", addresses[borrowAsset].address);
      getReserve();
      getGenesisNFT();
    }
  }, [isConnected, borrowAsset]);

  const handleBorrowSuccess = async function () {
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Newly created loans can take up to 5 minutes to appear.",
      title: "Loan Created!",
      position: "topR",
    });
  };

  const handleApprovalSuccess = async function () {
    setApproved(true);
    dispatch({
      type: "success",
      message: "You can now borrow using this asset.",
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

  const handleGenesisSwitchChange = (event) => {
    setLoadingGenesisBoost(true);
    console.log("Changed Genesis Switch", event.target.checked);
    setGenesisBoost(event.target.checked);
  };

  return (
    <div className={styles.container}>
      <div className="flex flex-col items-center">
        <div className="flex flex-col lg:m-8 lg:flex-row justify-center">
          <div className="flex flex-col items-center justify-center mb-4 lg:m-8">
            {props.token_uri ? (
              <Image
                loader={() => props.token_uri}
                src={props.token_uri}
                height="300"
                width="300"
                unoptimized={true}
                className="rounded-3xl"
              />
            ) : (
              <div>
                <Illustration height="180px" logo="token" width="100%" />
                Loading...
              </div>
            )}
            {genesisNFTId != 0 && (
              <div className="flex flex-row justify-center items-center">
                <Typography variant="caption14">Genesis Boost:</Typography>
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
                <Typography variant="subtitle2">Address</Typography>
                <Typography variant="caption14">
                  <p className="break-all">{props.token_address}</p>
                </Typography>
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
                    {tokenPrice != "0"
                      ? formatUnits(tokenPrice, 18) + " WETH"
                      : "Token Price Appraisal Error"}
                  </Typography>
                )}
              </div>
            </div>
            <div className="flex flex-row m-2">
              <div className="flex flex-col">
                <Typography variant="subtitle2">Max LTV</Typography>
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
                        "% (Boost) = " +
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
                  )}{" "}
                  WETH
                </Typography>
              </div>
            </div>
          </div>
        </div>
        <div className="m-8 lg:hidden">
          <Divider />
        </div>
        <div className="flex flex-col items-center m-2 border-2 rounded-3xl max-w-max items-center p-2">
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
            disabled={!approved}
            onChange={handleInputChange}
          />
        </div>
        {approved ? (
          <div className="flex m-8 mt-2">
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
                    const priceSig = await getAssetPriceSig(
                      requestID,
                      props.token_address,
                      props.token_id,
                      chain.id
                    );
                    if (borrowAsset == "ETH") {
                      tx = await marketSigner.borrowETH(
                        addresses[borrowAsset].address,
                        props.token_address,
                        props.token_id,
                        genesisNFTId,
                        requestID,
                        priceSig,
                        {
                          value: amount,
                        }
                      );
                    } else {
                      tx = await marketSigner.borrow(
                        addresses[borrowAsset].address,
                        amount,
                        props.token_address,
                        props.token_id,
                        genesisNFTId,
                        requestID,
                        priceSig
                      );
                    }
                    console.log(tx);
                    await tx.wait(1);
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
                    position: "topR",
                    icon: "bell",
                  });
                }
              }}
            />
          </div>
        ) : (
          <div className="flex m-8 mt-2">
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
                  const tx = await assetCollectionSigner.approve(
                    addresses.Market,
                    props.token_id
                  );
                  await tx.wait(1);
                  handleApprovalSuccess();
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
