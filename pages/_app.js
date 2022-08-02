import "../styles/globals.css";
import Layout from "../components/layout";
import SplashLayout from "../components/splashLayout";
import { useRouter } from "next/router";
import React from "react";
import { MoralisProvider } from "react-moralis";
import { NotificationProvider } from "web3uikit";

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
      <LayoutComponent>
        <NotificationProvider>
          <Component {...pageProps} />
        </NotificationProvider>
      </LayoutComponent>
    </MoralisProvider>
  );
}

export default MyApp;
