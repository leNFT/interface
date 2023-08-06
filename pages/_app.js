import Script from "next/script";
import "../styles/globals.css";
import Layout from "../components/layout";
import SplashLayout from "../components/splashLayout";
import { useRouter } from "next/router";
import React from "react";
import { NotificationProvider } from "@web3uikit/core";
import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultWallets,
  RainbowKitProvider,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";
import { alchemyProvider } from "wagmi/providers/alchemy";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isIndex = router.pathname == "/";
  const LayoutComponent = isIndex ? SplashLayout : Layout;
  const { chains, provider } = configureChains(
    [chain.sepolia, chain.mainnet],
    [
      alchemyProvider({ apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY }),
      publicProvider(),
    ]
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
        <RainbowKitProvider
          chains={chains}
          theme={lightTheme({
            accentColor: "#cfc8c8",
            accentColorForeground: "#474242",
            borderRadius: "medium",
            fontStack: "rounded",
            overlayBlur: "large",
          })}
        >
          <Script
            async
            src="https://www.googletagmanager.com/gtag/js?id=G-1T8JPML519"
          ></Script>
          <Script>
            {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-1T8JPML519');
            `}
          </Script>
          <Script
            defer
            src="https://api.pirsch.io/pirsch.js"
            id="pirschjs"
            data-code="e2QT8Re8oVzu1JJr0Nxf7hsXT3Psu0JF"
          ></Script>
          <LayoutComponent>
            <Component {...pageProps}></Component>
          </LayoutComponent>
        </RainbowKitProvider>
      </WagmiConfig>
    </NotificationProvider>
  );
}

export default MyApp;
