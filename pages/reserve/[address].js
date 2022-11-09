import { useAccount, useNetwork, useContract, useProvider } from "wagmi";
import { Button, Tooltip, Loading, Typography } from "@web3uikit/core";
import { getSupportedNFTs } from "../../helpers/getSupportedNFTs.js";
import { HelpCircle } from "@web3uikit/icons";
import { BigNumber } from "@ethersproject/bignumber";
import StyledModal from "../../components/StyledModal";
import { formatUnits } from "@ethersproject/units";
import contractAddresses from "../../contractAddresses.json";
import { useState, useEffect } from "react";
import marketContract from "../../contracts/Market.json";
import tokenOracleContract from "../../contracts/TokenOracle.json";
import reserveContract from "../../contracts/Reserve.json";
import LinearProgressWithLabel from "../../components/LinearProgressWithLabel";
import Deposit from "../../components/Deposit";
import Withdraw from "../../components/Withdraw";
import Box from "@mui/material/Box";
import erc20 from "../../contracts/erc20.json";
import { ethers } from "ethers";
import Router from "next/router";
import { useRouter } from "next/router";
import { ChevronLeft } from "@web3uikit/icons";
import { ExternalLink } from "@web3uikit/icons";

export default function Reserve() {
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
  const [underlyingSafeguard, setUnderyingSafeguard] = useState("0");
  const [maximumUtilizationRate, setMaximumUtilizationRate] = useState("0");
  const [protocolLiquidationFee, setProtocolLiquidationFee] = useState("0");
  const [liquidationPenalty, setLiquidationPenalty] = useState("0");

  const provider = useProvider();

  async function getReserveDetails() {
    const reserve = new ethers.Contract(
      router.query.address,
      reserveContract.abi,
      provider
    );

    const updatedDebt = await reserve.getDebt();
    console.log("Updated Debt:", updatedDebt);
    setDebt(updatedDebt.toString());

    const updatedAsset = await reserve.getAsset();
    console.log("Updated Asset:", updatedAsset);
    setAsset(updatedAsset.toString());

    const assetContract = new ethers.Contract(updatedAsset, erc20, provider);
    const updatedAssetSymbol = await assetContract.symbol();
    console.log("Updated Asset Symbol:", updatedAssetSymbol);
    setAssetSymbol(
      updatedAssetSymbol.toString() == "WETH"
        ? "ETH"
        : updatedAssetSymbol.toString()
    );

    const updatedUnderlyingBalance = await reserve.getUnderlyingBalance();
    console.log("Updated Underlying Balance:", updatedUnderlyingBalance);
    setUnderlyingBalance(updatedUnderlyingBalance.toString());

    const updatedUtilizationRate = await reserve.getUtilizationRate();
    console.log("Updated Utilization Rate:", updatedUtilizationRate);
    setUtilizationRate(updatedUtilizationRate.toNumber());

    const updatedSupplyRate = await reserve.getSupplyRate();
    console.log("Updated Supply Rate:", updatedSupplyRate);
    setSupplyRate(updatedSupplyRate.toNumber());

    const updatedBorrowRate = await reserve.getBorrowRate();
    console.log("Updated Borrow Rate:", updatedBorrowRate);
    setBorrowRate(updatedBorrowRate.toNumber());

    const updatedMaxAmount = await reserve.getMaximumWithdrawalAmount(address);
    console.log("Updated Max Withdrawal Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount.toString());

    const updatedUnderyingSafeguard = (
      await reserve.getUnderlyingSafeguard()
    ).toString();

    setUnderyingSafeguard(updatedUnderyingSafeguard);

    // Get default maximum utilization rate
    const updatedMaximumUtilizationRate = (
      await reserve.getMaximumUtilizationRate()
    ).toString();

    setMaximumUtilizationRate(updatedMaximumUtilizationRate);

    // Get protocol liquidation fee
    const updatedProtocolLiquidationFee = (
      await reserve.getLiquidationFee()
    ).toString();

    setProtocolLiquidationFee(updatedProtocolLiquidationFee);

    // Get underlying safeguard
    const updatedLiquidationPenalty = (
      await reserve.getLiquidationPenalty()
    ).toString();

    setLiquidationPenalty(updatedLiquidationPenalty);

    const updateReserveSupportedNFTs = await getSupportedNFTs(
      chain.id,
      router.query.address
    );
    setReserveSupportedNFTs(updateReserveSupportedNFTs);
    //Stop loading
    setLoadingReserve(false);
  }

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    console.log("router", router.query.address);
    if (router.query.address != undefined && isConnected) {
      console.log(
        "Got reserve address, setting the rest...",
        router.query.address
      );
      setLoadingReserve(true);
      getReserveDetails();
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
        <Deposit
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
        <Withdraw
          setVisibility={setVisibleWithdrawalModal}
          reserve={router.query.address}
          assetSymbol={assetSymbol}
          asset={asset}
          updateUI={getReserveDetails}
        />
      </StyledModal>
      <div className="flex flex-row justify-center">
        <div className="flex flex-col justify-center mr-auto ml-8">
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
        <div className="flex flex-col justify-center break-all">
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
      <div className="flex flex-row items-center justify-center p-4 rounded-3xl m-8 lg:m-16 bg-black/5 shadow-lg">
        <div className="flex flex-col m-2 md:flex-row border-2 rounded-2xl">
          <div className="flex flex-col m-4">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
              }}
            >
              Liquidation Penalty
            </Box>
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
              }}
            >
              {BigNumber.from(liquidationPenalty).div(100) + "%"}
            </Box>
          </div>
          <div className="flex flex-col m-4">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
              }}
            >
              Protocol Liquidation Fee
            </Box>
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
              }}
            >
              {BigNumber.from(protocolLiquidationFee).div(100) + "%"}
            </Box>
          </div>
        </div>
        <div className="flex flex-col m-2 md:flex-row border-2 rounded-2xl">
          <div className="flex flex-col m-4">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
              }}
            >
              Max Utilization Rate
            </Box>
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
              }}
            >
              {BigNumber.from(maximumUtilizationRate).div(100) + "%"}
            </Box>
          </div>
          <div className="flex flex-col m-4">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
                fontWeight: "bold",
              }}
            >
              Underlying Safeguard
            </Box>
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
              }}
            >
              {formatUnits(underlyingSafeguard, 18) + " WETH"}
            </Box>
          </div>
        </div>
      </div>
    </div>
  );
}
