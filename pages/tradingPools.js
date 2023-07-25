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
import poolFilters from "../filters/pools.json";

export default function TradingPools() {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const [tableData, setTableData] = useState([]);

  async function updateTableData() {
    const tradingPools = await getTradingPools(chain ? chain.id : 1);
    console.log("TradingPools", tradingPools);
    var newTableData = [];

    const { soon: soonPools, new: newPools } =
      poolFilters[chain ? chain.id : 1];

    // Initialize the arrays here
    var newPoolsArray = [];
    var otherPoolsArray = [];
    var soonPoolsArray = [];

    for (const [key, value] of Object.entries(tradingPools)) {
      var isSoonPool = soonPools.includes(key);
      var isNewPool = newPools.includes(key);
      const poolData = {
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
      };

      if (isNewPool) {
        newPoolsArray.push(poolData);
      } else if (isSoonPool) {
        soonPoolsArray.push(poolData);
      } else {
        otherPoolsArray.push(poolData);
      }
    }

    var newTableData = [
      ...otherPoolsArray,
      ...newPoolsArray,
      ...soonPoolsArray,
    ];

    setTableData(newTableData);
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
