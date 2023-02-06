import {
  useAccount,
  useBalance,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import Link from "@mui/material/Link";
import Box from "@mui/material/Box";
import { BigNumber } from "@ethersproject/bignumber";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { CardActionArea } from "@mui/material";
import { getAddressNFTs } from "../../helpers/getAddressNFTs.js";
import { formatUnits, parseUnits } from "@ethersproject/units";
import Image from "next/image";
import {
  useNotification,
  Button,
  Input,
  Typography,
  Select,
} from "@web3uikit/core";
import { Dropdown } from "@nextui-org/react";
import styles from "../../styles/Home.module.css";
import contractAddresses from "../../contractAddresses.json";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import tradingPoolContract from "../../contracts/TradingPool.json";
import wethGatewayContract from "../../contracts/WETHGateway.json";
import erc20 from "../../contracts/erc20.json";
import erc721 from "../../contracts/erc721.json";

export default function DepositTradingPool(props) {
  const [curve, setCurve] = useState("exponential");
  const [delta, setDelta] = useState("");
  const [fee, setFee] = useState("");
  const [initialPrice, setInitialPrice] = useState("");
  const [tokenAmount, setTokenAmount] = useState("");
  const [nftAmount, setNFTAmount] = useState(0);
  const [userNFTs, setUserNFTs] = useState([]);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [selectingNFTs, setSelectingNFTs] = useState(false);
  const [approvedToken, setApprovedToken] = useState(false);
  const [approvedNFT, setApprovedNFT] = useState(false);
  const [approvalNFTLoading, setApprovalNFTLoading] = useState(false);
  const { address, isConnected } = useAccount();
  const { data: signer } = useSigner();
  const [depositLoading, setDepositLoading] = useState(false);
  const dispatch = useNotification();
  const { chain } = useNetwork();
  const provider = useProvider();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const wethGatewaySigner = useContract({
    contractInterface: wethGatewayContract.abi,
    addressOrName: addresses.WETHGateway,
    signerOrProvider: signer,
  });

  const tokenProvider = useContract({
    contractInterface: erc20,
    addressOrName: props.token,
    signerOrProvider: provider,
  });

  const nftProvider = useContract({
    contractInterface: erc721,
    addressOrName: props.nft,
    signerOrProvider: provider,
  });

  async function getUserNFTs() {
    // Get lp positions
    const addressNFTs = await getAddressNFTs(address, props.nft, chain.id);
    setUserNFTs(addressNFTs);
    console.log(addressNFTs);
  }

  async function getNFTAllowance() {
    const allowed = await nftProvider.isApprovedForAll(
      address,
      addresses.WETHGateway
    );

    console.log("Got nft allowed:", allowed);

    if (allowed) {
      setApprovedNFT(true);
    } else {
      setApprovedNFT(false);
    }
  }

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    if (props.pool && props.token && props.nft && isConnected) {
      console.log("Got trading pool address, setting the rest...", props.pool);
      getNFTAllowance();
      getUserNFTs();
    }
  }, [props.pool, props.token, props.nft, address]);

  const handleDepositSuccess = async function () {
    // Reset the UI
    setSelectedNFTs([]);
    setInitialPrice("");
    setTokenAmount("");
    setDelta("");
    setFee("");
    setNFTAmount(0);

    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Your tokens were deposited in the pool.",
      title: "Deposit Successful!",
      position: "bottomL",
    });
  };

  const handleNFTApprovalSuccess = async function () {
    setApprovedNFT(true);
    dispatch({
      type: "success",
      message: "You can now deposit.",
      title: "Approval Successful!",
      position: "bottomL",
    });
  };

  function handleTokenAmountChange(e) {
    if (e.target.value != "") {
      console.log("newTokenAmount", parseUnits(e.target.value, 18));
      setTokenAmount(e.target.value);
    } else {
      setTokenAmount("0");
    }
  }

  function handleInitialPriceChange(e) {
    if (e.target.value != "") {
      console.log("newInitialPrice", parseUnits(e.target.value, 18));
      setInitialPrice(e.target.value);
    } else {
      setInitialPrice("0");
    }
  }

  function handleDeltaChange(e) {
    if (e.target.value != "") {
      setDelta(e.target.value);
    } else {
      setDelta("");
    }
  }

  function handleFeeChange(e) {
    if (e.target.value != "") {
      setFee(e.target.value);
    } else {
      setFee("");
    }
  }

  function handleCurveChange(e) {
    setCurve(e);
  }

  return (
    <div>
      <div className="flex items-center justify-center flex-row">
        <Box
          sx={{
            fontFamily: "Monospace",
            fontSize: "subtitle2.fontSize",
          }}
          className="border-b-2 border-pink-200"
        >
          <Link
            href="https://lenft.gitbook.io/lenft-docs/fundamentals/trading-lp-parameters"
            underline="none"
            target="_blank"
            color={"blue"}
          >
            {"Need help choosing your LP's parameters?"}
          </Link>
        </Box>
      </div>
      <div className="flex flex-row items-center justify-center mt-8 m-4">
        <Box
          className="flex mx-4 justify-center items-center"
          sx={{
            fontFamily: "Monospace",
            fontSize: "subtitle2.fontSize",
            fontWeight: "bold",
          }}
        >
          Price Curve:
        </Box>
        <Dropdown>
          <Dropdown.Button flat>
            {curve && curve.replace(/^./, curve[0].toUpperCase())}
          </Dropdown.Button>
          <Dropdown.Menu
            aria-label="Static Actions"
            selectionMode="single"
            onAction={handleCurveChange}
            disallowEmptySelection
            selectedKeys={[curve]}
          >
            <Dropdown.Item key="exponential">Exponential</Dropdown.Item>
            <Dropdown.Item key="linear">Linear</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
      <div className="flex flex-row items-center justify-center mt-8 m-12">
        <Input
          label={
            curve == "exponential"
              ? "Delta %"
              : curve == "linear"
              ? "Delta (Amount)"
              : "Delta"
          }
          value={delta}
          type="number"
          step="any"
          placeholder="0"
          description="The LP price change after each buy/sell"
          validation={{
            numberMin: 0,
          }}
          onChange={handleDeltaChange}
        />
      </div>
      <div className="flex flex-row items-center justify-center m-12">
        <Input
          label="Initial Price"
          type="number"
          placeholder="> 0"
          value={initialPrice}
          step="any"
          description="The initial price of the LP"
          validation={{
            numberMin: formatUnits("1", 18),
          }}
          onChange={handleInitialPriceChange}
        />
      </div>
      <div className="flex flex-row items-center justify-center m-12">
        <Input
          label="ETH Amount"
          type="number"
          placeholder="0"
          value={tokenAmount}
          step="any"
          validation={{
            numberMin: 0,
          }}
          description="Amount of ETH to deposit."
          onChange={handleTokenAmountChange}
        />
      </div>
      <div className="flex flex-row items-center justify-center m-12">
        <Input
          label="Fee %"
          type="number"
          placeholder="0"
          value={fee}
          step="any"
          validation={{
            numberMin: 0,
          }}
          description="Fee charged by your LP"
          onChange={handleFeeChange}
        />
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        {approvedNFT ? (
          <Button
            text={nftAmount ? "Selected " + nftAmount + " NFTs" : "Select NFTs"}
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
              setSelectingNFTs(!selectingNFTs);
            }}
          />
        ) : (
          <Button
            text="Approve NFT"
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            isLoading={approvalNFTLoading}
            onClick={async function () {
              try {
                setApprovalNFTLoading(true);
                console.log("signer.", signer);
                const nftContract = new ethers.Contract(
                  props.nft,
                  erc721,
                  signer
                );
                const tx = await nftContract.setApprovalForAll(
                  addresses.WETHGateway,
                  true
                );
                await tx.wait(1);
                handleNFTApprovalSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setApprovalNFTLoading(false);
              }
            }}
          ></Button>
        )}
      </div>
      {selectingNFTs &&
        (userNFTs.length > 0 ? (
          <div className="flex flex-row grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {userNFTs.map((nft, _) => (
              <div
                key={BigNumber.from(nft.id.tokenId).toNumber()}
                className="flex items-center justify-center max-w-[300px]"
              >
                <Card
                  sx={{
                    borderRadius: 4,
                    background: selectedNFTs.find(
                      (element) =>
                        element == BigNumber.from(nft.id.tokenId).toNumber()
                    )
                      ? "linear-gradient(to right bottom, #fccb90 0%, #d57eeb 100%)"
                      : "linear-gradient(to right bottom, #eff2ff, #f0e5e9)",
                  }}
                >
                  <CardActionArea
                    onClick={function () {
                      //If it's selected we unselect and if its unselected we select
                      var newSelectedNFTs = selectedNFTs.slice();
                      var index = newSelectedNFTs.findIndex(
                        (element) =>
                          element == BigNumber.from(nft.id.tokenId).toNumber()
                      );
                      if (index == -1) {
                        newSelectedNFTs.push(
                          BigNumber.from(nft.id.tokenId).toNumber()
                        );
                        setNFTAmount(nftAmount + 1);
                      } else {
                        newSelectedNFTs.splice(index, 1);
                        setNFTAmount(nftAmount - 1);
                      }
                      setSelectedNFTs(newSelectedNFTs);
                    }}
                  >
                    <div className="flex flex-col items-center p-1">
                      {nft.metadata.image ? (
                        <Image
                          loader={() => nft.metadata.image}
                          src={nft.metadata.image}
                          height="100"
                          width="100"
                          className="rounded-xl"
                        />
                      ) : (
                        <Box
                          className="flex m-2 justify-center items-center w-[100px] h-[100px]"
                          sx={{
                            fontFamily: "Monospace",
                            fontSize: "caption",
                          }}
                        >
                          No Image
                        </Box>
                      )}
                      <Box
                        className="mt-1"
                        sx={{
                          fontFamily: "Monospace",
                          fontSize: "caption",
                        }}
                      >
                        {BigNumber.from(nft.id.tokenId).toNumber()}
                      </Box>
                    </div>
                  </CardActionArea>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "subtitle2.fontSize",
              fontWeight: "bold",
            }}
            className="flex m-2 justify-center items-center text-center"
          >
            {"Couldn't find any " + props.nftName + "'s in your wallet"}
          </Box>
        ))}
      <div className="flex flex-row items-center justify-center m-8">
        <Button
          text={
            "Deposit (" +
            (tokenAmount ? tokenAmount : 0) +
            " tokens, " +
            (nftAmount ? nftAmount : 0) +
            " NFTs)"
          }
          theme="secondary"
          isFullWidth
          loadingProps={{
            spinnerColor: "#000000",
            spinnerType: "loader",
            direction: "right",
            size: "24",
          }}
          disabled={!approvedNFT || (!tokenAmount && !nftAmount)}
          loadingText=""
          isLoading={depositLoading}
          onClick={async function () {
            try {
              if (initialPrice == 0) {
                dispatch({
                  type: "error",
                  message: "Your initial price should be greater than 1e-18",
                  title: "Initial Price",
                  position: "bottomL",
                });
              }
              setDepositLoading(true);
              console.log("Depositing to trading pool", props.pool);
              var curveAddress = "";
              var curveDelta = 0;
              console.log("delta", delta);
              if (curve == "exponential") {
                curveAddress = addresses.ExponentialCurve;
                curveDelta = delta * 100;
              } else if (curve == "linear") {
                curveAddress = addresses.LinearCurve;
                curveDelta = parseUnits(delta, 18);
              }
              const tx = await wethGatewaySigner.depositTradingPool(
                props.pool,
                selectedNFTs,
                parseUnits(initialPrice, 18).toString(),
                curveAddress,
                curveDelta,
                fee * 100,
                {
                  value: parseUnits(tokenAmount, 18).toString(),
                }
              );
              await tx.wait(1);
              handleDepositSuccess();
            } catch (error) {
              console.log(error);
            } finally {
              setDepositLoading(false);
            }
          }}
        ></Button>
      </div>
    </div>
  );
}
