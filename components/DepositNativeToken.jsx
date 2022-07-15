import { BigNumber } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { useNotification, Button, Input, Typography } from "web3uikit";
import styles from "../styles/Home.module.css";
import contractAddresses from "../contractAddresses.json";
import { useWeb3Contract, useMoralis } from "react-moralis";
import { useState, useEffect } from "react";
import Link from "next/link";
import marketContract from "../contracts/Market.json";
import erc20 from "../contracts/erc20.json";

export default function DepositNativeToken(props) {}
