import styles from "../styles/Home.module.css";
import Link from "next/link";
import { Button } from "@web3uikit/core";
import { style } from "@mui/system";
import { STATEMENT_TYPES } from "@babel/types";
import { StyleSheetManager } from "styled-components";

export default function Home() {
  return (

    <div className={styles.main}>
      <div className={styles.header_center}>
        <div className={styles.header_logo}>
          <a>
            <img src="logo.png" className={styles.header_logo_img}></img> 
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
        <div className={styles.index_describe}>
          <p className={styles.index_protocol_describe}>
            leNFT is a Peer-To-Pool NFT liquidity Protocol </p>
          <p className={styles.index_protocol_describe_more}>
            Mortgage NFT to borrow Deposit assets earn interest </p>
       </div>
      </div>
    </div>    
  );
}
