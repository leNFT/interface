import Header from "./Header";
import Footer from "./Footer";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { useMoralis } from "react-moralis";
import { Typography } from "web3uikit";

export default function Layout({ children }) {
  const { isWeb3Enabled, chainId } = useMoralis();
  const supportedChains = ["0x5"];

  return (
    <>
      <Head>
        <title>leNFT App</title>
        <meta name="description" content="Lend NFT" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      {isWeb3Enabled ? (
        supportedChains.includes(chainId) ? (
          <main>{children}</main>
        ) : (
          <div className={styles.container}>
            <div className={styles.main}>
              <Typography variant="body18">Chain ID not supported</Typography>
            </div>
          </div>
        )
      ) : (
        <div className={styles.container}>
          <div className={styles.main}>
            <Typography variant="body18">
              Please connect a Web 3 wallet.
            </Typography>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}
