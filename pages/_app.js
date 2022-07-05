import "../styles/globals.css";
import { MoralisProvider } from "react-moralis";
import { NotificationProvider } from "web3uikit";
import Layout from "../components/layout";

function MyApp({ Component, pageProps }) {
  return (
    <MoralisProvider
      serverUrl="https://mrmnjfhprkn8.usemoralis.com:2053/server"
      appId="SHMhOUhuFQ7rN4QvfItwiFG3qwaz4TEHz4hE78eP"
    >
      <NotificationProvider>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </NotificationProvider>
    </MoralisProvider>
  );
}

export default MyApp;
