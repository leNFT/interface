import {
  useAccount,
  useBalance,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import Box from "@mui/material/Box";
import { BigNumber } from "@ethersproject/bignumber";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import { CardActionArea } from "@mui/material";
import { getAddressNFTs } from "../helpers/getAddressNFTs.js";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useNotification, Button, Input, Typography } from "@web3uikit/core";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import reserveContract from "../contracts/Reserve.json";
import wethGatewayContract from "../contracts/WETHGateway.json";
import erc20 from "../contracts/erc20.json";
import erc721 from "../contracts/erc721.json";

export default function DepositTradingPool(props) {
  const [tokenAmount, setTokenAmount] = useState("0");
  const [nftAmount, setNFTAmount] = useState(0);
  const [userNFTs, setUserNFTs] = useState([]);
  const [selectedNFTs, setSelectedNFTs] = useState([]);
  const [selectingNFTs, setSelectingNFTs] = useState(false);
  const [approvedToken, setApprovedToken] = useState(false);
  const [approvedNFT, setApprovedNFT] = useState(false);
  const [approvalNFTLoading, setApprovalNFTLoading] = useState(false);
  const [approvalTokenLoading, setApprovalTokenLoading] = useState(false);

  const [depositLoading, setDepositLoading] = useState(false);
  const dispatch = useNotification();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();
  const provider = useProvider();
  const { data: ethBalance } = useBalance({
    addressOrName: address,
  });
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

  async function getTokenAllowance() {
    const allowance = await tokenProvider.allowance(address, props.pool);

    console.log("Got allowance:", allowance);

    if (!allowance.eq(BigNumber.from(0)) || props.assetSymbol == "ETH") {
      setApprovedToken(true);
    } else {
      setApprovedToken(false);
    }
  }

  async function getNFTAllowance() {
    const allowed = await nftProvider.isApprovedForAll(address, props.pool);

    console.log("Got nft allowed:", allowed);

    if (allowed) {
      setApprovedNFT(true);
    } else {
      setApprovedNFT(false);
    }
  }

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    if (props.pool && props.token && props.nft) {
      console.log("Got trading pool address, setting the rest...", props.pool);
      getTokenAllowance();
      getNFTAllowance();
      getUserNFTs();
    }
  }, [props.pool, props.token, props.nft]);

  const handleDepositSuccess = async function () {
    console.log("Deposited", amount);
    props.updateUI();
    props.setVisibility(false);
    updateTokenBalance();
    dispatch({
      type: "success",
      message: "Your tokens were deposited into the reserve.",
      title: "Deposit Successful!",
      position: "topR",
    });
  };

  const handleNFTApprovalSuccess = async function () {
    setApprovedNFT(true);
    dispatch({
      type: "success",
      message: "You can now deposit.",
      title: "Approval Successful!",
      position: "topR",
    });
  };

  const handleTokenApprovalSuccess = async function () {
    setApprovedToken(true);
    dispatch({
      type: "success",
      message: "You can now deposit.",
      title: "Approval Successful!",
      position: "topR",
    });
  };

  function handleInputChange(e) {
    if (e.target.value != "") {
      setTokenAmount(parseUnits(e.target.value, 18).toString());
    } else {
      setTokenAmount("0");
    }
  }

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center m-8">
        {approvedToken ? (
          <Input
            label="Amount"
            type="number"
            step="any"
            validation={{
              numberMin: 0,
            }}
            disabled={!approvedToken}
            onChange={handleInputChange}
          />
        ) : (
          <Button
            text="Approve Token"
            theme="secondary"
            isFullWidth
            loadingProps={{
              spinnerColor: "#000000",
              spinnerType: "loader",
              direction: "right",
              size: "24",
            }}
            loadingText=""
            isLoading={approvalTokenLoading}
            onClick={async function () {
              try {
                setApprovalTokenLoading(true);
                console.log("signer.", signer);
                const tokenContract = new ethers.Contract(
                  props.token,
                  erc20,
                  signer
                );
                const tx = await tokenContract.approve(
                  props.pool,
                  "115792089237316195423570985008687907853269984665640564039457584007913129639935"
                );
                await tx.wait(1);
                handleTokenApprovalSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setApprovalTokenLoading(false);
              }
            }}
          ></Button>
        )}
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        {approvedNFT ? (
          <Button
            text={"Selected " + nftAmount + " NFTs"}
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
                  props.pool,
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
      {selectingNFTs && (
        <div className="flex flex-row grid md:grid-cols-3 lg:grid-cols-4">
          {userNFTs.map((nft, _) => (
            <div
              key={BigNumber.from(nft.id.tokenId).toNumber()}
              className="flex m-4 items-center justify-center max-w-[300px]"
            >
              <Card
                sx={{
                  borderRadius: 4,
                  background: selectedNFTs.find(
                    (element) =>
                      element == BigNumber.from(nft.id.tokenId).toNumber()
                  )
                    ? "linear-gradient(120deg, #fccb90 0%, #d57eeb 100%)"
                    : "linear-gradient(to right bottom, #eff2ff, #f0e5e9)",
                }}
              >
                <CardActionArea
                  onClick={function () {
                    //If it's selected we unselect and if its unselected we select
                    var index = selectedNFTs.findIndex(
                      (element) =>
                        element == BigNumber.from(nft.id.tokenId).toNumber()
                    );
                    if (index == -1) {
                      selectedNFTs.push(
                        BigNumber.from(nft.id.tokenId).toNumber()
                      );
                      setNFTAmount(nftAmount + 1);
                    } else {
                      selectedNFTs.splice(index, 1);
                      setNFTAmount(nftAmount - 1);
                    }
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "caption",
                      }}
                    >
                      {BigNumber.from(nft.id.tokenId).toNumber()}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-row items-center justify-center m-8">
        <Button
          text={
            "Deposit (" +
            formatUnits(tokenAmount, 18) +
            " tokens, " +
            nftAmount +
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
          disabled={!approvedToken || !approvedNFT}
          loadingText=""
          isLoading={depositLoading}
          onClick={async function () {
            if (BigNumber.from(amount).lte(BigNumber.from(balance))) {
              try {
                setDepositLoading(true);
                var tx;
                if (props.assetSymbol == "ETH") {
                  console.log("Depositing ETH");
                  tx = await wethGatewaySigner.depositETH(props.reserve, {
                    value: amount,
                  });
                } else {
                  const reserve = new ethers.Contract(
                    props.reserve,
                    reserveContract.abi,
                    signer
                  );
                  tx = await reserve.deposit(amount, address);
                }
                await tx.wait(1);
                handleDepositSuccess();
              } catch (error) {
                console.log(error);
              } finally {
                setDepositLoading(false);
              }
            } else {
              dispatch({
                type: "error",
                message: "Amount is bigger than balance",
                title: "Error",
                position: "topR",
              });
            }
          }}
        ></Button>
      </div>
    </div>
  );
}
