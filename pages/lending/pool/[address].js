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
import lendingPoolContract from "../../../contracts/LendingPool.json";
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
  const [poolSupportedNFTs, setPoolSupportedNFTs] = useState({});
  const [visibleDepositModal, setVisibleDepositModal] = useState(false);
  const [visibleWithdrawalModal, setVisibleWithdrawalModal] = useState(false);
  const [maxAmount, setMaxAmount] = useState("0");
  const [underlyingBalance, setUnderlyingBalance] = useState("0");
  const [supplyRate, setSupplyRate] = useState(0);
  const [borrowRate, setBorrowRate] = useState(0);
  const [utilizationRate, setUtilizationRate] = useState(0);
  const [loadingPool, setLoadingPool] = useState(false);
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const [tvlSafeguard, setTVLSafeguard] = useState("0");
  const [maximumUtilizationRate, setMaximumUtilizationRate] = useState("0");
  const [liquidationFee, setLiquidationFee] = useState("0");
  const [liquidationPenalty, setLiquidationPenalty] = useState("0");

  const provider = useProvider();

  async function getLendingPoolDetails() {
    const lendingPool = new ethers.Contract(
      router.query.address,
      lendingPoolContract.abi,
      provider
    );

    const updatedDebt = await lendingPool.getDebt();
    console.log("Updated Debt:", updatedDebt);
    setDebt(updatedDebt.toString());

    const updatedAsset = await lendingPool.asset();
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

    const updatedUnderlyingBalance = await lendingPool.getUnderlyingBalance();
    console.log("Updated Underlying Balance:", updatedUnderlyingBalance);
    setUnderlyingBalance(updatedUnderlyingBalance.toString());

    const updatedUtilizationRate = await lendingPool.getUtilizationRate();
    console.log("Updated Utilization Rate:", updatedUtilizationRate);
    setUtilizationRate(updatedUtilizationRate.toNumber());

    const updatedSupplyRate = await lendingPool.getSupplyRate();
    console.log("Updated Supply Rate:", updatedSupplyRate);
    setSupplyRate(updatedSupplyRate.toNumber());

    const updatedBorrowRate = await lendingPool.getBorrowRate();
    console.log("Updated Borrow Rate:", updatedBorrowRate);
    setBorrowRate(updatedBorrowRate.toNumber());

    const updatedMaxAmount = await lendingPool.maxWithdraw(address);
    console.log("Updated Max Withdrawal Amount:", updatedMaxAmount);
    setMaxAmount(updatedMaxAmount.toString());

    const updatedUnderyingSafeguard = (
      await lendingPool.getTVLSafeguard()
    ).toString();

    setTVLSafeguard(updatedUnderyingSafeguard);

    // Get default maximum utilization rate
    const updatedMaximumUtilizationRate = (
      await lendingPool.getMaximumUtilizationRate()
    ).toString();

    setMaximumUtilizationRate(updatedMaximumUtilizationRate);

    // Get protocol liquidation fee
    const updatedliquidationFee = (
      await lendingPool.getLiquidationFee()
    ).toString();

    setLiquidationFee(updatedliquidationFee);

    // Get underlying safeguard
    const updatedLiquidationPenalty = (
      await lendingPool.getLiquidationPenalty()
    ).toString();

    setLiquidationPenalty(updatedLiquidationPenalty);

    const updatedPoolSupportedNFTs = await getLendingNFTCollections(
      chain.id,
      router.query.address
    );
    setPoolSupportedNFTs(updatedPoolSupportedNFTs);
    //Stop loading
    setLoadingPool(false);
  }

  // Set the rest of the UI when we receive the lending pool address
  useEffect(() => {
    console.log("router", router.query.address);
    if (router.query.address != undefined && isConnected) {
      console.log(
        "Got pool address, setting the rest...",
        router.query.address
      );
      setLoadingPool(true);
      getLendingPoolDetails();
    }
  }, [isConnected, router.query.address, address]);

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
          pool={router.query.address}
          assetSymbol={assetSymbol}
          asset={asset}
          updateUI={getLendingPoolDetails}
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
          pool={router.query.address}
          assetSymbol={assetSymbol}
          asset={asset}
          updateUI={getLendingPoolDetails}
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
                pathname: "/lendingPools",
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
      <div className="flex flex-row justify-center items-center mt-4">
        <div className="flex flex-col justify-center items-center p-6 rounded-3xl m-2 lg:mx-8 bg-black/5 shadow-lg">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "h5.fontSize",
              fontWeight: "bold",
            }}
          >
            Collections:
          </Box>
          <div className="mt-4">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "h6.fontSize",
              }}
            >
              {Object.values(poolSupportedNFTs).map((nft) => nft.name + " ")}
            </Box>
          </div>
        </div>
        <div className="flex flex-col justify-center items-center p-6 rounded-3xl m-2 lg:mx-8 bg-black/5 shadow-lg">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "h5.fontSize",
              fontWeight: "bold",
            }}
          >
            Assets:
          </Box>
          <div className="mt-4">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "h6.fontSize",
              }}
            >
              {assetSymbol}
            </Box>
          </div>
        </div>
      </div>
      <div className="flex flex-col-reverse md:flex-row items-center justify-center p-4 rounded-3xl m-4 bg-black/5 shadow-lg">
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
                  My Pool Balance
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
              {loadingPool ? (
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
          {loadingPool ? (
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
      <div className="flex flex-row items-center justify-center p-4 rounded-3xl m-4 lg:m-8 bg-black/5 shadow-lg">
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
              {BigNumber.from(liquidationFee).div(100) + "%"}
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
              {formatUnits(BigNumber.from(underlyingBalance).add(debt), 18) +
                " / " +
                formatUnits(tvlSafeguard, 18) +
                " WETH"}
            </Box>
          </div>
        </div>
      </div>
    </div>
  );
}
