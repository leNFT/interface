import styles from "../styles/Home.module.css";
import Box from "@mui/material/Box";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="flex flex-row justify-evenly items-center w-full">
        <div className="flex flex-col space-y-2 items-start">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "subtitle1.fontSize",
              fontWeight: "bold",
            }}
          >
            Use leNFT
          </Box>
          <a href="/trade" target="_blank" rel="noopener noreferrer">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
              }}
            >
              Trade
            </Box>
          </a>
          <a href="/lend" target="_blank" rel="noopener noreferrer">
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
              }}
            >
              Borrow
            </Box>
          </a>
        </div>
        <div className="flex flex-col space-y-2 items-start">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "subtitle1.fontSize",
              fontWeight: "bold",
            }}
          >
            Social
          </Box>
          <a
            href="http://discord.gg/hWyBHrUDAk"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
              }}
            >
              Discord
            </Box>
          </a>
          <a
            href="https://twitter.com/lenftapp"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
              }}
            >
              Twitter
            </Box>
          </a>
        </div>
        <div className="flex flex-col space-y-2 items-start">
          <Box
            sx={{
              fontFamily: "Monospace",
              fontSize: "subtitle1.fontSize",
              fontWeight: "bold",
            }}
          >
            Developers
          </Box>
          <a
            href="https://lenft.gitbook.io/lenft-docs/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
              }}
            >
              Docs
            </Box>
          </a>
          <a
            href="https://github.com/leNFT"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Box
              sx={{
                fontFamily: "Monospace",
                fontSize: "subtitle2.fontSize",
              }}
            >
              Github
            </Box>
          </a>
        </div>
      </div>
    </footer>
  );
}
