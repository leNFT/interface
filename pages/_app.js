import "../styles/globals.css";
import { MoralisProvider } from "react-moralis";
import { NotificationProvider } from "web3uikit";
import Layout from "../components/layout";
import SplashLayout from "../components/splashLayout";
import { useRouter } from "next/router";
import React from "react";

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isIndex = router.pathname == "/";
  console.log("path", router.pathname);
  const LayoutComponent = isIndex ? SplashLayout : Layout;
  return (
    <MoralisProvider
      serverUrl="https://mrmnjfhprkn8.usemoralis.com:2053/server"
      appId="SHMhOUhuFQ7rN4QvfItwiFG3qwaz4TEHz4hE78eP"
    >
      <NotificationProvider>
        <LayoutComponent>
          <Component {...pageProps} />
        </LayoutComponent>
      </NotificationProvider>
    </MoralisProvider>
  );
}

export default MyApp;
