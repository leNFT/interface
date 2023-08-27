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
import Input from "@mui/material/Input";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import { Button } from "grommet";
import { Skeleton } from "@mui/material";
import { ethers } from "ethers";
import Image from "next/image";
import { useAccount, useNetwork } from "wagmi";
import { getTradingPools } from "../helpers/getTradingPools.js";
import { formatUnits } from "@ethersproject/units";
import { useState, useEffect } from "react";
import Router from "next/router";
import CreateTradingPool from "../components/trading/CreateTradingPool";
import StyledModal from "../components/StyledModal";
import poolFilters from "../filters/pools.json";

export default function TradingPools() {
  const { isConnected } = useAccount();
  const { chain } = useNetwork();
  const [tableData, setTableData] = useState([]);
  const [visibleCreateTradingPoolModal, setVisibleCreateTradingPoolModal] =
    useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

    if (searchTerm) {
      newTableData = newTableData.filter((pool) =>
        pool.nft.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setTableData(newTableData);
  }

  useEffect(() => {
    updateTableData();
  }, [isConnected, searchTerm]);

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
    <div>
      <StyledModal
        hasFooter={false}
        title="Create Trading Pool"
        isVisible={visibleCreateTradingPoolModal}
        onCloseButtonPressed={function () {
          setVisibleCreateTradingPoolModal(false);
        }}
      >
        <CreateTradingPool setVisibility={setVisibleCreateTradingPoolModal} />
      </StyledModal>
      <div className="mx-1 md:mx-8">
        <div className="flex flex-row w-full justify-between items-center mb-2">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            }
            placeholder="Collections"
            style={{
              flexGrow: 0.5, // This makes the input take the available space in the middle
              border: "1px solid #ddd",
              height: "40px", // Align the text vertically center
              borderRadius: "12px", // Rounded border
              background: "rgba(255, 255, 255, 0.6)", // White with 70% opacity (translucency)
              paddingLeft: "10px", // Space for the search icon
              paddingRight: "10px", // Spacing on the right side
              marginRight: "10px", // Space before the button
              underline: { display: "none" }, // To hide the underline
            }}
            inputProps={{
              style: {
                fontFamily: "Monospace",
                "::placeholder": {
                  fontFamily: "Monospace",
                },
              },
            }}
            disableUnderline // This removes the default underline of the MUI Input
          />

          <Button
            primary
            size="small"
            color={"#063970"}
            onClick={() => {
              console.log("New Pool");
              setVisibleCreateTradingPoolModal(true);
            }}
            label={
              <Box
                sx={{
                  fontFamily: "Monospace",
                  fontWeight: "bold",
                  letterSpacing: 1,
                }}
              >
                Create New Pool
              </Box>
            }
          />
        </div>

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
                  sx={{
                    fontFamily: "monospace",
                    fontSize: { xs: "1rem", sm: "1.125rem" },
                    fontWeight: "bold",
                  }}
                >
                  Name
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: "monospace",
                    fontSize: {
                      xs: "1rem", // equivalent to Tailwind's text-md
                      sm: "1.125rem", // equivalent to Tailwind's text-lg
                    },
                    fontWeight: "bold", // equivalent to Tailwind's font-bold
                    display: {
                      xs: "none", // equivalent to Tailwind's hidden
                      md: "table-cell", // equivalent to Tailwind's md:table-cell
                    },
                  }}
                >
                  TVL
                </TableCell>
                <TableCell
                  sx={{
                    fontFamily: "monospace",
                    fontSize: { xs: "1rem", sm: "1.125rem" },
                    fontWeight: "bold",
                  }}
                >
                  Volume
                </TableCell>
                <TableCell
                  sx={{
                    display: {
                      xs: "none",
                      md: "table-cell",
                    },
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
                        <Skeleton
                          variant="rectangular"
                          width={80}
                          height={80}
                        />
                      </Box>
                    )}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "monospace",
                      fontSize: {
                        xs: "0.875rem",
                        sm: "1rem",
                        md: "16px",
                      },
                    }}
                  >
                    {row.nft}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "monospace",
                      fontSize: {
                        xs: "0.875rem",
                        sm: "1rem",
                        md: "16px",
                      },
                      display: {
                        xs: "none",
                        md: "table-cell",
                      },
                    }}
                  >
                    {row.token}
                  </TableCell>
                  <TableCell
                    sx={{
                      fontFamily: "monospace",
                      fontSize: {
                        xs: "0.875rem",
                        sm: "1rem",
                        md: "16px",
                      },
                    }}
                  >
                    {row.volume}
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      display: {
                        xs: "none",
                        md: "table-cell",
                      },
                    }}
                  >
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
    </div>
  );
}
