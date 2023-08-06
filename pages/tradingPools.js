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

    // Concatenating the new and other pools arrays
    var combinedPoolsArray = [...newPoolsArray, ...otherPoolsArray];

    // Sorting the combined array by volume in descending order
    combinedPoolsArray.sort((a, b) => {
      return (
        Number(tradingPools[b.poolAddress].token.amount) -
        Number(tradingPools[a.poolAddress].token.amount)
      );
    });

    newTableData = [...combinedPoolsArray, ...soonPoolsArray];

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
    <div className="mx-1 md:mx-8">
      <TableContainer
        sx={{
          borderRadius: "18px",
          backgroundColor: "rgba(255, 255, 255, 0.2)",
        }}
      >
        <Table aria-label="Trading Pools">
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell
                className="text-md sm:text-lg font-bold"
                sx={{
                  fontFamily: "monospace",
                }}
              >
                Name
              </TableCell>
              <TableCell
                className="text-md sm:text-lg font-bold hidden md:table-cell"
                sx={{
                  fontFamily: "monospace",
                }}
              >
                TVL
              </TableCell>
              <TableCell
                className="text-md sm:text-lg font-bold"
                sx={{
                  fontFamily: "monospace",
                }}
              >
                Volume
              </TableCell>
              <TableCell className="hidden md:table-cell"></TableCell>
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
                    row.isSoonPool ? (
                      <Badge
                        disableOutline
                        color="warning"
                        content="SOON"
                        size="sm"
                        shape="rectangle"
                      >
                        <Image
                          src={row.image}
                          height={80}
                          width={80}
                          alt="NFT Image"
                          loader={({ src }) => src}
                        />
                      </Badge>
                    ) : row.isNewPool ? (
                      <Badge
                        disableOutline
                        color="success"
                        content="NEW"
                        size="sm"
                        shape="rectangle"
                      >
                        <Image
                          src={row.image}
                          height={80}
                          width={80}
                          alt="NFT Image"
                          loader={({ src }) => src}
                        />
                      </Badge>
                    ) : (
                      <Image
                        src={row.image}
                        height={80}
                        width={80}
                        alt="NFT Image"
                        loader={({ src }) => src}
                      />
                    )
                  ) : (
                    <Box sx={{ width: 80, height: 80 }}>
                      <Skeleton variant="rectangular" width={80} height={80} />
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <Typography
                    className="text-sm sm:text-md"
                    fontFamily={"monospace"}
                  >
                    {row.nft}
                  </Typography>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Typography
                    className="text-sm sm:text-md "
                    fontFamily={"monospace"}
                  >
                    {row.token}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography
                    className="text-sm sm:text-md"
                    fontFamily={"monospace"}
                  >
                    {row.volume}
                  </Typography>
                </TableCell>
                <TableCell align="center" className="hidden md:table-cell">
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
                        );
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
    </div>
  );
}
