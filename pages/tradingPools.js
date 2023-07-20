import {
  Tooltip,
  Typography,
  TableContainer,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { Badge } from "@nextui-org/react";
import { Box } from "@mui/system";
import { Button } from "grommet";
import { Skeleton } from "@mui/material";
import { ethers } from "ethers";
import Image from "next/image";
import { useAccount, useNetwork } from "wagmi";
import { getTradingPools } from "../helpers/getTradingPools.js";
import { formatUnits } from "@ethersproject/units";
import { useState, useEffect } from "react";
import Router from "next/router";

export default function TradingPools() {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const [tableData, setTableData] = useState([]);
  const [loadingTableData, setLoadingTableData] = useState(true);

  async function updateTableData() {
    setLoadingTableData(true);
    const tradingPools = await getTradingPools(isConnected ? chain.id : 1);
    console.log("TradingPools", tradingPools);
    var newTableData = [];

    var hiddenPools = [
      "0xb08369eAD888c671b3c7D763EEF458383CD36FA6",
      "0x31d098d541796491CAb9a40762F906abECbfD0a5",
    ];
    var soonPools = ["0x2609df95dC37B46276182A8A86470085e06B57Ff"];
    var newPools = ["0xb2FD99528Ce8f7a6AecFC24c286e63E9D19f06F1"];

    for (const [key, value] of Object.entries(tradingPools)) {
      if (hiddenPools.includes(key)) {
        continue; // Skip this loop iteration if the pool is a hidden pool
      }
      var isSoonPool = soonPools.includes(key);
      var isNewPool = newPools.includes(key);
      newTableData.push({
        key: key,
        image: value.nft.image,
        nft: value.nft.name,
        token: isSoonPool
          ? "—.— ETH"
          : Number(formatUnits(value.token.amount, 18)).toPrecision(2) + " ETH",
        volume: isSoonPool
          ? "—.— ETH"
          : Number(formatUnits(value.volume, 18)).toPrecision(2) + " ETH",
        gauge: value.gauge != ethers.constants.AddressZero ? "Yes" : "No",
        gaugeAddress: value.gauge,
        poolAddress: key,
        clickable: !isSoonPool,
        isSoonPool: isSoonPool,
        isNewPool: isNewPool,
      });
    }

    setTableData(newTableData);
    setLoadingTableData(false);
  }

  useEffect(() => {
    updateTableData();
  }, [isConnected]);

  const handleRowClick = (row) => {
    if (row.clickable) {
      Router.push({
        pathname: "/trading/pool/[address]",
        query: {
          address: row.key,
        },
      });
    }
  };

  return (
    <TableContainer
      sx={{
        borderRadius: "18px",
        backgroundColor: "rgba(255, 255, 255, 0.2)",
      }}
    >
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                fontSize: "1.2em",
                fontFamily: "monospace",
              }}
            >
              Token
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                fontSize: "1.2em",
                fontFamily: "monospace",
              }}
            >
              TVL
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                fontSize: "1.2em",
                fontFamily: "monospace",
              }}
            >
              Volume
            </TableCell>
            <TableCell
              sx={{
                fontWeight: "bold",
                fontSize: "1.2em",
                fontFamily: "monospace",
              }}
            ></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {tableData.map((row) => (
            <TableRow
              key={row.key}
              hover
              onClick={() => row.clickable && handleRowClick(row)}
              sx={{
                cursor: "pointer",
                "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
              }}
            >
              <TableCell component="th" scope="row">
                {row.image ? (
                  <Image
                    src={row.image}
                    height={80}
                    width={80}
                    alt="NFT Image"
                    loader={({ src }) => src}
                  />
                ) : (
                  <Box sx={{ width: 80, height: 80 }}>
                    <Skeleton variant="rectangular" width={80} height={80} />
                  </Box>
                )}
              </TableCell>
              <TableCell>
                <Box>
                  {row.isSoonPool && (
                    <Badge
                      disableOutline
                      color="warning"
                      content="SOON"
                      size="sm"
                      shape="rectangle"
                      horizontalOffset="-25%"
                      verticalOffset="-20%"
                    >
                      <Typography variant="subtitle1" fontFamily={"monospace"}>
                        {row.nft}
                      </Typography>
                    </Badge>
                  )}
                  {row.isNewPool && (
                    <Badge
                      disableOutline
                      color="success"
                      content="NEW"
                      size="sm"
                      shape="rectangle"
                      horizontalOffset="-20%"
                      verticalOffset="-15%"
                    >
                      <Typography variant="subtitle1" fontFamily={"monospace"}>
                        {row.nft}
                      </Typography>
                    </Badge>
                  )}
                  {!row.isSoonPool && !row.isNewPool && (
                    <Typography variant="subtitle1" fontFamily={"monospace"}>
                      {row.nft}
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle1" fontFamily={"monospace"}>
                  {row.token}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle1" fontFamily={"monospace"}>
                  {row.volume}
                </Typography>
              </TableCell>
              <TableCell align="center">
                <Button
                  primary
                  size="small"
                  color={row.gauge === "Yes" ? "#063970" : "white"}
                  onClick={async (event) => {
                    event.stopPropagation();
                    if (row.gauge === "Yes") {
                      Router.push(`/trading/gauge/${row.gaugeAddress}`);
                    } else {
                      window.open(
                        "https://discord.com/invite/QNpBmMCWmb",
                        "_blank"
                      ); // Replace with your Discord link
                    }
                  }}
                  label={
                    <Box
                      sx={{
                        fontFamily: "Monospace",
                        fontSize: "caption.fontSize",
                        fontWeight: "bold",
                        letterSpacing: 2,
                      }}
                    >
                      {row.gauge === "Yes" ? "Gauge" : "Request Gauge"}
                    </Box>
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
