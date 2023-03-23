import express from "express";
import { Wallets, Gateway } from "fabric-network";
import * as yaml from "js-yaml";
import { readFileSync } from "fs";
import path from "path";
const app = express();

const currentFilePath = new URL(import.meta.url).pathname;
const currentDir = path.dirname(currentFilePath);
const parentDir = path.dirname(path.dirname(currentDir));
const channelName = "supplychain";
const chaincodeId = "basic";

const loadIdentity = async () => {
  const wallet = await Wallets.newFileSystemWallet(
    "./server/identity/user/farmer/wallet"
  );

  const cert = readFileSync(
    parentDir +
      "/agrifood/agri-food/organizations/peerOrganizations/farmer.com/users/User1@farmer.com/msp/signcerts/User1@farmer.com-cert.pem"
  ).toString();
  const key = readFileSync(
    parentDir +
      "/agrifood/agri-food/organizations/peerOrganizations/farmer.com/users/User1@farmer.com/msp/keystore/priv_sk"
  ).toString();

  const identityLabel = "User1@farmer.com";
  const identity = {
    credentials: {
      certificate: cert,
      privateKey: key,
    },
    mspId: "FarmerMSP",
    type: "X.509",
  };

  await wallet.put(identityLabel, identity);
};

app.get("/createCommodity", async (req, res) => {
  await loadIdentity();
  const connectionProfile = await yaml.load(
    readFileSync(
      process.cwd() + "/server/connections/agriFoodFarmer.yaml",
      "utf8"
    )
  );
  const wallet = await Wallets.newFileSystemWallet(
    "./server/identity/user/farmer/wallet"
  );
  const gateway = new Gateway();
  const gatewayOptions = {
    identity: "User1@farmer.com", // Previously imported identity
    wallet,
  };
  await gateway.connect(connectionProfile, gatewayOptions);
  try {
    // Obtain the smart contract with which our application wants to interact
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeId);

    // Submit transactions for the smart contract
    const args = ["08", "test", "test"];
    const submitResult = await contract.submitTransaction(
      "CreateCommodity",
      ...args
    );

    console.log(submitResult.toJSON());
  } finally {
    // Disconnect from the gateway peer when all work for this client identity is complete
    gateway.disconnect();
  }
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
