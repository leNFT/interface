import "../styles/globals.css";
import Layout from "../components/layout";
import SplashLayout from "../components/splashLayout";
import { useRouter } from "next/router";
import React from "react";
import { NotificationProvider } from "@web3uikit/core";
import "@rainbow-me/rainbowkit/styles.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { alchemyProvider } from "wagmi/providers/alchemy";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isIndex = router.pathname == "/";
  const LayoutComponent = isIndex ? SplashLayout : Layout;
  const { chains, provider } = configureChains(
    [chain.mainnet, chain.goerli],
    [alchemyProvider({ apiKey: process.env.ALCHEMY_API_KEY }), publicProvider()]
  );

  const { connectors } = getDefaultWallets({
    appName: "leNFT App",
    chains,
  });

  const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
  });

  return (
    <NotificationProvider>
      <WagmiConfig client={wagmiClient}>
        <RainbowKitProvider chains={chains}>
          <LayoutComponent>
            <Component {...pageProps} />
          </LayoutComponent>
        </RainbowKitProvider>
      </WagmiConfig>
    </NotificationProvider>
  );
}

export default MyApp;
