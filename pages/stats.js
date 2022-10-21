import styles from "../styles/Home.module.css";
import { getAssetPrice } from "../helpers/getAssetPrice.js";
import { ethers } from "ethers";
import { getNFTImage } from "../helpers/getNFTImage.js";
import { getAddressNFTs } from "../helpers/getAddressNFTs.js";
import { getSupportedNFTs } from "../helpers/getSupportedNFTs.js";
import contractAddresses from "../contractAddresses.json";
import { BigNumber } from "@ethersproject/bignumber";
import { getAddress } from "@ethersproject/address";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import loanCenterContract from "../contracts/LoanCenter.json";
import nftOracleContract from "../contracts/NFTOracle.json";
import { useState, useEffect } from "react";
import { useAccount, useNetwork } from "wagmi";
import { calculateHealthLevel } from "../helpers/healthLevel";
import { Illustration, Loading, Typography, Tooltip } from "@web3uikit/core";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import CardContent from "@mui/material/CardContent";
import { CardActionArea } from "@mui/material";
import { HelpCircle } from "@web3uikit/icons";
import Image from "next/image";
import LinearProgressWithLabel from "../components/LinearProgressWithLabel";
import Divider from "@mui/material/Divider";
import Liquidate from "../components/Liquidate";
import { useContract, useProvider } from "wagmi";
import StyledModal from "../components/StyledModal";
import erc721 from "../contracts/erc721.json";

// "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6"

export default function Stats() {
  return (
    <div className=''>stats</div>
  )
}

