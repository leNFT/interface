import { useState, useEffect } from "react";
import { Button, Tooltip, Loading, Typography } from "@web3uikit/core";
import { HelpCircle } from "@web3uikit/icons";
import { BigNumber } from "@ethersproject/bignumber";
import StyledModal from "../../../components/StyledModal";
import { formatUnits, parseUnits } from "@ethersproject/units";
import contractAddresses from "../../../contractAddresses.json";
import votingEscrowContract from "../../../contracts/VotingEscrow.json";
import gaugeControllerContract from "../../../contracts/GaugeController.json";
import lendingGaugeContract from "../../../contracts/LendingGauge.json";
import lendingPoolContract from "../../../contracts/LendingPool.json";
import StakeLendingGauge from "../../../components/gauges/StakeLendingGauge";
import UnstakeLendingGauge from "../../../components/gauges/UnstakeLendingGauge";
import Box from "@mui/material/Box";
import { ethers } from "ethers";
import {
  useAccount,
  useNetwork,
  useProvider,
  useSigner,
  useContract,
} from "wagmi";
import Router from "next/router";
import { useRouter } from "next/router";
import { ChevronLeft } from "@web3uikit/icons";
import { ExternalLink } from "@web3uikit/icons";
import erc20 from "../../../contracts/erc20.json";

export default function TradingPoolGauge() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const router = useRouter();
  const { data: signer } = useSigner();
  const [lpToken, setLPToken] = useState("");
  const [lpTokenSymbol, setLPTokenSymbol] = useState("");
  const [boost, setBoost] = useState(0);
  const [maturityMultiplier, setMaturityMultiplier] = useState(0);
  const [stakedAmount, setStakedAmount] = useState("0");
  const [claimableRewards, setClaimableRewards] = useState("0");
  const [visibleStakeModal, setVisibleStakeModal] = useState(false);
  const [visibleUnstakeModal, setVisibleUnstakeModal] = useState(false);
  const [loadingGauge, setLoadingGauge] = useState(false);
  const [clamingLoading, setClaimingLoading] = useState(false);
  const provider = useProvider();
  const [epoch, setEpoch] = useState(0);
  const [apr, setAPR] = useState("0");
  const [totalLocked, setTotalLocked] = useState("0");

  var addresses = contractAddresses[1];
  const votingEscrowProvider = useContract({
    contractInterface: votingEscrowContract.abi,
    addressOrName: addresses.VotingEscrow,
    signerOrProvider: provider,
  });

  const gaugeControllerProvider = useContract({
    contractInterface: gaugeControllerContract.abi,
    addressOrName: addresses.GaugeController,
    signerOrProvider: provider,
  });

  // Update the UI
  async function updateUI() {
    const gauge = new ethers.Contract(
      router.query.address,
      lendingGaugeContract.abi,
      provider
    );
    // Set gauge details
    const lpTokenResponse = await gauge.getLPToken();
    setLPToken(lpTokenResponse.toString());
    console.log("lpTokenResponse", lpTokenResponse.toString());

    // Get the name of the LP token
    const lpTokenProvider = new ethers.Contract(
      lpTokenResponse.toString(),
      erc20,
      provider
    );
    const lpTokenSymbolResponse = await lpTokenProvider.symbol();
    setLPTokenSymbol(lpTokenSymbolResponse.toString());

    // Get the current epoch
    const updatedEpoch = await votingEscrowProvider.getEpoch(
      Math.floor(Date.now() / 1000)
    );
    console.log("updatedEpoch", updatedEpoch.toNumber());
    setEpoch(updatedEpoch.toNumber());

    // Get the total locked amount
    const updatedTotalLocked = await gauge.getTotalSupply();
    console.log("updatedTotalLocked", updatedTotalLocked.toString());
    setTotalLocked(updatedTotalLocked.toString());

    // Get the APR
    const previousGaugeRewards =
      await gaugeControllerProvider.callStatic.getGaugeRewards(
        router.query.address,
        updatedEpoch.toNumber() == 0 ? 0 : updatedEpoch.toNumber() - 1
      );
    const nativeTokenPrice = "0";

    const lendingPool = new ethers.Contract(
      lpTokenResponse.toString(),
      lendingPoolContract.abi,
      provider
    );
    const totalLocked = await lendingPool.maxWithdraw(router.query.address);

    if (nativeTokenPrice.toString() == "0" || totalLocked.toString() == "0") {
      setAPR(0);
    } else {
      setAPR(
        BigNumber.from(previousGaugeRewards)
          .mul(nativeTokenPrice)
          .mul(100)
          .div(updatedTotalLocked)
          .toNumber()
      );
    }

    if (isConnected) {
      const boostResponse = await gauge.getUserBoost(address);
      setBoost(boostResponse.toNumber());

      const maturityMultiplierResponse = await gauge.getUserMaturityMultiplier(
        address
      );
      console.log(
        "maturityMultiplierResponse",
        maturityMultiplierResponse.toNumber()
      );
      setMaturityMultiplier(maturityMultiplierResponse.toNumber());

      // Get staked amount
      const stakedAmount = BigNumber.from(
        await gauge.getBalanceOf(address)
      ).toString();
      setStakedAmount(stakedAmount);

      // Get the claimable rewards
      const updatedClaimableRewards = await gauge.callStatic.claim({
        from: address,
      });
      console.log("updatedClaimableRewards", updatedClaimableRewards);
      setClaimableRewards(updatedClaimableRewards.toString());
    }
  }

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    if (router.query.address) {
      updateUI();
    }
  }, [isConnected, router.query.address, address]);

  const handleClaimingSuccess = async function () {
    dispatch({
      type: "success",
      message: "You have claimed your rewards.",
      title: "Claim Successful!",
      position: "bottomL",
    });
  };

  return (
    <div>
      <StyledModal
        hasFooter={false}
        title={"Stake LP"}
        isVisible={visibleStakeModal}
        width="50%"
        onCloseButtonPressed={function () {
          setVisibleStakeModal(false);
        }}
      >
        <StakeLendingGauge
          setVisibility={setVisibleStakeModal}
          gauge={router.query.address}
          lpTokenSymbol={lpTokenSymbol}
          lpToken={lpToken}
          updateUI={updateUI}
        />
      </StyledModal>
      <StyledModal
        hasFooter={false}
        title={"Unstake LP"}
        width="50%"
        isVisible={visibleUnstakeModal}
        onCloseButtonPressed={function () {
          setVisibleUnstakeModal(false);
        }}
      >
        <UnstakeLendingGauge
          setVisibility={setVisibleUnstakeModal}
          gauge={router.query.address}
          lpTokenSymbol={lpTokenSymbol}
          updateUI={updateUI}
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
                  "https://sepolia.etherscan.io/address/" +
                    router.query.address,
                  "_blank"
                );
              }
            }}
          />
        </div>
      </div>
      <div className="flex flex-col items-center">
        <div className="flex flex-col py-4 px-8 m-8 mb-2 items-center justify-center text-center rounded-3xl bg-black/5 shadow-lg max-w-fit">
          <div className="flex flex-row items-center justify-center">
            <div className="flex flex-col items-start m-2 mx-4">
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "subtitle1.fontSize",
                }}
              >
                Epoch
              </Box>
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontSize: "h4.fontSize",
                }}
              >
                {epoch}
              </Box>
            </div>
            <div className="flex flex-col items-end m-2 border-l-2 border-stone-600 p-6">
              <div className="flex flex-col items-end text-right mb-4">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  APR
                </Box>
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle1.fontSize",
                  }}
                >
                  {apr + " %"}
                </Box>
              </div>
              <div className="flex flex-col items-end text-right mt-4">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  Total Locked
                </Box>
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle1.fontSize",
                  }}
                >
                  {Number(formatUnits(totalLocked, 18)).toPrecision(4) +
                    " " +
                    lpTokenSymbol}
                </Box>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-center p-4 rounded-3xl m-2 md:m-8 lg:m-16 !mt-8 bg-black/5 shadow-lg">
          <div className="flex flex-col items-center p-4 rounded-3xl min-w-[280px] m-8 bg-black/5 shadow-lg">
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
                    My Gauge Info
                  </Box>
                </div>
                <div className="flex flex-col ml-1">
                  <Tooltip
                    content="The amount of LP tokens you have staked in this gauge."
                    position="top"
                    minWidth={200}
                  >
                    <HelpCircle fontSize="20px" color="#000000" />
                  </Tooltip>
                </div>
              </div>
              <div className="flex flex-row m-2">
                <div className="flex flex-col">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "h5.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    {"Staked: " +
                      formatUnits(stakedAmount, 18) +
                      " " +
                      lpTokenSymbol}
                  </Box>
                </div>
              </div>
              <div className="flex flex-col m-2 space-y-1 p-3 border-4 border-slate-400 rounded-lg w-fit">
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  {boost / 10000 + "x Boost"}
                </Box>
                <Box
                  sx={{
                    fontFamily: "Monospace",
                    fontSize: "subtitle2.fontSize",
                    fontWeight: "bold",
                  }}
                >
                  {maturityMultiplier / 10000 + "x 🕚 Multiplier"}
                </Box>
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
                  text="Stake"
                  theme="custom"
                  size="large"
                  radius="12"
                  onClick={async function () {
                    setVisibleStakeModal(true);
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
                  text="Unstake"
                  theme="custom"
                  size="large"
                  radius="12"
                  onClick={async function () {
                    setVisibleUnstakeModal(true);
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-center rounded-3xl m-2 md:m-8 bg-black/5 shadow-lg">
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
                    Claimable:
                  </Box>
                </div>
                <div className="flex flex-col ml-1">
                  <Tooltip
                    content="The amount available to claim from this gauge"
                    position="top"
                    minWidth={200}
                  >
                    <HelpCircle fontSize="20px" color="#000000" />
                  </Tooltip>
                </div>
              </div>
              <div className="flex flex-row m-2">
                <div className="flex flex-col">
                  <Box
                    sx={{
                      fontFamily: "Monospace",
                      fontSize: "h6.fontSize",
                      fontWeight: "bold",
                    }}
                  >
                    {formatUnits(claimableRewards, 18) + " LE"}
                  </Box>
                </div>
              </div>
            </div>
            <div className="flex flex-row items-center ">
              <div className="mb-4">
                <Button
                  customize={{
                    backgroundColor: "grey",
                    fontSize: 20,
                    textColor: "white",
                  }}
                  text="Claim"
                  theme="custom"
                  size="large"
                  radius="12"
                  loadingProps={{
                    spinnerColor: "#000000",
                    spinnerType: "loader",
                    direction: "right",
                    size: "24",
                  }}
                  disabled={BigNumber.from(claimableRewards).eq(0)}
                  loadingText=""
                  isLoading={clamingLoading}
                  onClick={async function () {
                    const gauge = new ethers.Contract(
                      router.query.address,
                      lendingGaugeContract.abi,
                      signer
                    );
                    try {
                      setClaimingLoading(true);
                      console.log("signer.", signer);
                      const tx = await gauge.claim();
                      await tx.wait(1);
                      handleClaimingSuccess();
                    } catch (error) {
                      console.log(error);
                    } finally {
                      setClaimingLoading(false);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
