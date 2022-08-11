import styles from "../styles/Home.module.css";
import Link from "next/link";
import { Button } from "@web3uikit/core";
import { style } from "@mui/system";
import { STATEMENT_TYPES } from "@babel/types";
import { StyleSheetManager } from "styled-components";

export default function Home() {
  return (

    <div className={styles.main}>
      <div className={styles.headerCenter}>
        <div className={styles.headerLogo}>
          <a>
            <img src="symbol.png" className={styles.headerLogoImg}></img> 
          </a>
        </div>
    
        <nav>
          <ul id="main-nav" className={styles.nav} >
          <li>
            <a
              href="http://discord.gg/hWyBHrUDAk"
              target="_blank"
              rel="noopener noreferrer">
            Discord
          </a>
          </li>
          <li>
            <a
              href="https://twitter.com/lenftapp"
              target="_blank"
              rel="noopener noreferrer"
            >
            Twitter
            </a>
          </li>
          <li>
          <a
            href="https://github.com/leNFT"
              target="_blank"
              rel="noopener noreferrer"
            >
            Github
            </a>
          </li>
          <li>
          <a
            href="https://lenft.gitbook.io/lenft-docs/"
            target="_blank"
            rel="noopener noreferrer"
            >
            Docs
            </a>
          </li>
          <li>
          <Link href="/app">
            <a>
              <Button
                onClick={function noRefCheck() {}}
                color="blue"
                theme="colored"
                text="Launch App"
              />
            </a>
          </Link>
          </li>
        </ul>
        </nav>
      </div>
    
      <div className={styles.main}>
        <div className={styles.indexDescribe}>
          <p className={styles.indexProtocolDescribe}>
            leNFT is a Peer-To-Pool NFT Liquidity Protocol </p>
          <p className={styles.indexProtocolDescribe2}>
            Borrow using only your NFTs Gain interest on your ETH </p>
       </div>
      </div>
    </div>    
  );
}
