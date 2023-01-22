import { useAccount, useNetwork, useContract, useProvider } from "wagmi";
import { Button, Tooltip, Loading, Typography } from "@web3uikit/core";
import { getLendingNFTCollections } from "../../../helpers/getLendingNFTCollections.js";
import { HelpCircle } from "@web3uikit/icons";
import { BigNumber } from "@ethersproject/bignumber";
import StyledModal from "../../../components/StyledModal";
import { formatUnits } from "@ethersproject/units";
import contractAddresses from "../../../contractAddresses.json";
import { useState, useEffect } from "react";
import lendingMarketContract from "../../../contracts/LendingMarket.json";
import tokenOracleContract from "../../../contracts/TokenOracle.json";
import reserveContract from "../../../contracts/Reserve.json";
import LinearProgressWithLabel from "../../../components/LinearProgressWithLabel";
import DepositLendingPool from "../../../components/lending/DepositLendingPool";
import WithdrawLendingPool from "../../../components/lending/WithdrawLendingPool";
import Box from "@mui/material/Box";
import erc20 from "../../../contracts/erc20.json";
import { ethers } from "ethers";
import Router from "next/router";
import { useRouter } from "next/router";
import { ChevronLeft } from "@web3uikit/icons";
import { ExternalLink } from "@web3uikit/icons";

export default function LendingPool() {
  const router = useRouter();
  const [debt, setDebt] = useState("0");
  const [asset, setAsset] = useState("");
  const [assetSymbol, setAssetSymbol] = useState("");
  const [reserveSupportedNFTs, setReserveSupportedNFTs] = useState({});
  const [visibleDepositModal, setVisibleDepositModal] = useState(false);
  const [visibleWithdrawalModal, setVisibleWithdrawalModal] = useState(false);
  const [maxAmount, setMaxAmount] = useState("0");
  const [underlyingBalance, setUnderlyingBalance] = useState("0");
  const [supplyRate, setSupplyRate] = useState(0);
  const [borrowRate, setBorrowRate] = useState(0);
  const [utilizationRate, setUtilizationRate] = useState(0);
  const [loadingReserve, setLoadingReserve] = useState(false);
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();

  const gaugeProvider = useContract({
    contractInterface: tradingGaugeContract.abi,
    addressOrName: router.query.address,
    signerOrProvider: provider,
  });

  const gaugeSigner = useContract({
    contractInterface: tradingGaugeContract.abi,
    addressOrName: router.query.address,
    signerOrProvider: signer,
  });

  async function updateUI() {
    // Set gauge details
    const lpTokenResponse = await gaugeProvider.lpToken();
    setLPToken(lpTokenResponse.toString());

    const boostResponse = await gaugeProvider.userBoost(address);
    setBoost(boostResponse.toNumber());
  }

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    console.log("router", router.query.address);
    if (router.query.address != undefined && isConnected) {
      updateUI();
    }
  }, [isConnected, router.query.address]);

  return (
    <div>
      <StyledModal
        hasFooter={false}
        title={"Deposit " + assetSymbol}
        isVisible={visibleDepositModal}
        width="50%"
        onCloseButtonPressed={function () {
          setVisibleDepositModal(false);
        }}
      >
        <DepositLendingPool
          setVisibility={setVisibleDepositModal}
          reserve={router.query.address}
          assetSymbol={assetSymbol}
          asset={asset}
          updateUI={getReserveDetails}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title={"Withdraw " + assetSymbol}
        width="50%"
        isVisible={visibleWithdrawalModal}
        onCloseButtonPressed={function () {
          setVisibleWithdrawalModal(false);
        }}
      >
        <WithdrawLendingPool
          setVisibility={setVisibleWithdrawalModal}
          reserve={router.query.address}
          assetSymbol={assetSymbol}
          asset={asset}
          updateUI={getReserveDetails}
        />
      </StyledModal>
      <div className="flex flex-row justify-center">
        <div className="flex flex-col justify-center mr-auto ml-4">
          <Button
            size="small"
            color="#eae5ea"
            iconLayout="icon-only"
            icon={<ChevronLeft fontSize="50px" />}
            onClick={async function () {
              Router.push({
                pathname: "/reserves",
              });
            }}
          />
        </div>
        <div className="flex flex-col justify-center break-all ml-4">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "body2.fontSize",
            }}
          >
            {router.query.address}
          </Box>
        </div>
        <div className="flex flex-col justify-center pb-1 mr-auto">
          <Button
            size="large"
            color="#eae5ea"
            iconLayout="icon-only"
            icon={<ExternalLink fontSize="20px" />}
            onClick={async function (_event) {
              if (chain.id == 1) {
                window.open(
                  "https://etherscan.io/address/" + router.query.address,
                  "_blank"
                );
              } else if (chain.id == 5) {
                window.open(
                  "https://goerli.etherscan.io/address/" + router.query.address,
                  "_blank"
                );
              }
            }}
          />
        </div>
      </div>
      <div className="flex flex-col-reverse md:flex-row items-center justify-center p-4 rounded-3xl m-8 lg:m-16 !mt-8 bg-black/5 shadow-lg">
        <div className="flex flex-col items-center p-4 rounded-3xl m-8 lg:m-16 bg-black/5 shadow-lg">
          <div className="flex flex-col m-4 rounded-2xl">
            <div className="flex flex-row m-2">
              <div className="flex flex-col">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "h6.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  My Reserve Balance
                </Box>
              </div>
              <div className="flex flex-col ml-1">
                <Tooltip
                  content="Deposits + interest accrued by the protocol"
                  position="top"
                  minWidth={200}
                >
                  <HelpCircle fontSize="20px" color="#000000" />
                </Tooltip>
              </div>
            </div>
            <div className="flex flex-row mx-2 mb-2">
              {loadingReserve ? (
                <Loading size={12} spinnerColor="#000000" />
              ) : (
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle1.fontSize",
                  }}
                >
                  {formatUnits(maxAmount, 18) + " " + assetSymbol}
                </Box>
              )}
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center ">
            <div className="m-4">
              <Button
                customize={{
                  backgroundColor: "grey",
                  fontSize: 20,
                  textColor: "white",
                }}
                text="Deposit"
                theme="custom"
                size="large"
                radius="12"
                onClick={async function () {
                  setVisibleDepositModal(true);
                }}
              />
            </div>
            <div className="m-4">
              <Button
                customize={{
                  backgroundColor: "grey",
                  fontSize: 20,
                  textColor: "white",
                }}
                text="Withdraw"
                theme="custom"
                size="large"
                radius="12"
                onClick={async function () {
                  setVisibleWithdrawalModal(true);
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col m-8 lg:my-16 lg:mx-16">
          <div className="mb-8">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "h4.fontSize",
                fontWeight: "bold",
                lineHeight: 1,
              }}
            >
              <div>Supply APR: {supplyRate / 100}%</div>
            </Box>
          </div>
          <div>
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "body1.fontSize",
              }}
            >
              Utilization Rate:
            </Box>
            <LinearProgressWithLabel value={utilizationRate / 100} />
          </div>
          {loadingReserve ? (
            <div className="flex m-4">
              <Loading size={12} spinnerColor="#000000" />
            </div>
          ) : (
            <div>
              <div className="my-2">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "body1.fontSize",
                  }}
                >
                  Borrow APR: {borrowRate / 100}%
                </Box>
              </div>
              <div className="my-2">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "body1.fontSize",
                  }}
                >
                  Underlying:{" "}
                  {formatUnits(underlyingBalance, 18) + " " + assetSymbol}
                </Box>
              </div>
              <div className="my-2">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "body1.fontSize",
                  }}
                >
                  Debt: {formatUnits(debt, 18) + " " + assetSymbol}
                </Box>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col justify-center items-center p-8 rounded-3xl m-8 lg:m-16 bg-black/5 shadow-lg">
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: "h5.fontSize",
            fontWeight: "bold",
          }}
        >
          Supported NFTs:
        </Box>
        <div className="mt-4">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "h6.fontSize",
            }}
          >
            {Object.values(reserveSupportedNFTs).map((nft) => nft.name + " ")}
          </Box>
        </div>
      </div>
    </div>
  );
}
