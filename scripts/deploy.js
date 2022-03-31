require("dotenv").config({ path: ".env" });
const hre = require("hardhat");

async function main() {
  const Votings = await hre.ethers.getContractFactory("Votings");
  const votings = await Votings.deploy();

  await votings.deployed();

  console.log("Votings deployed to:", votings.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
