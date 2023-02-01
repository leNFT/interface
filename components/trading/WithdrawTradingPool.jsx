import {
  useAccount,
  useNetwork,
  useContract,
  useProvider,
  useSigner,
} from "wagmi";
import { formatUnits } from "@ethersproject/units";
import { useNotification, Button, Typography } from "@web3uikit/core";

import styles from "../../styles/Home.module.css";
import contractAddresses from "../../contractAddresses.json";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import tradingPoolContract from "../../contracts/TradingPool.json";
import wethGatewayContract from "../../contracts/WETHGateway.json";
import erc721 from "../../contracts/erc721.json";

export default function WithdrawTradingPool(props) {
  const [tokenAmount, setTokenAmount] = useState("0");
  const [nfts, setNFTs] = useState([]);
  const [price, setPrice] = useState(0);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const dispatch = useNotification();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer } = useSigner();
  const addresses =
    chain && chain.id in contractAddresses
      ? contractAddresses[chain.id]
      : contractAddresses["1"];

  const wethGatewaySigner = useContract({
    contractInterface: wethGatewayContract.abi,
    addressOrName: addresses.WETHGateway,
    signerOrProvider: signer,
  });

  async function getLP() {
    const pool = new ethers.Contract(
      props.pool,
      tradingPoolContract.abi,
      provider
    );

    // GEt LP
    console.log("props.lp", props.lp);
    const lpResponse = await pool.getLP(props.lp);
    console.log("lpResponse", lpResponse);
    setPrice(formatUnits(lpResponse.price.toString(), 18));
    setTokenAmount(lpResponse.tokenAmount.toString());
    setNFTs(lpResponse.nftIds);
  }

  // Set the rest of the UI when we receive the reserve address
  useEffect(() => {
    if (props.pool !== undefined && props.lp !== undefined) {
      console.log("props.lp", props.lp);
      console.log("pool", props.pool);

      getLP();
    }
  }, [props.pool, props.lp]);

  const handleWithdrawSuccess = async function () {
    props.updateUI();
    props.setVisibility(false);
    dispatch({
      type: "success",
      message: "Your LP was successfully removed from the pool.",
      title: "Removal Successful!",
      position: "bottomR",
    });
  };

  return (
    <div className={styles.container}>
      <div className="flex flex-row items-center justify-center m-8">
        <Typography variant="subtitle1">{"LP #" + props.lp}</Typography>
      </div>
      <div className="flex flex-row m-8">
        <Typography variant="subtitle2">
          {"LP Price: " + price + " ETH"}
        </Typography>
      </div>
      <div className="flex flex-row items-center m-8">
        <Typography variant="subtitle2">
          {formatUnits(tokenAmount, 18) + " Tokens"}
        </Typography>
      </div>
      <div className="flex flex-row items-center  m-8">
        <Typography variant="subtitle2">
          {nfts.length + " NFTs: " + nfts.toString()}
        </Typography>
      </div>
      <div className="flex flex-row items-center justify-center m-8">
        <Button
          text={"Remove LP"}
          theme="secondary"
          isFullWidth
          loadingProps={{
            spinnerColor: "#000000",
            spinnerType: "loader",
            direction: "right",
            size: "24",
          }}
          loadingText=""
          isLoading={withdrawLoading}
          onClick={async function () {
            try {
              setWithdrawLoading(true);
              console.log("signer.", signer);
              var tx;
              if (props.assetSymbol == "ETH") {
                console.log("Depositing ETH");
                tx = await wethGatewaySigner.depositETH(props.reserve, {
                  value: amount,
                });
              } else {
                const tradingPool = new ethers.Contract(
                  props.pool,
                  tradingPoolContract.abi,
                  signer
                );
                console.log("Removing LP");
                tx = await tradingPool.removeLiquidity(props.lp);
              }
              await tx.wait(1);
              handleWithdrawSuccess();
            } catch (error) {
              console.log(error);
            } finally {
              setWithdrawLoading(false);
            }
          }}
        ></Button>
      </div>
    </div>
  );
}
