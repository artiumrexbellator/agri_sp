import express from "express";
import { Wallets, Gateway } from "fabric-network";
import * as yaml from "js-yaml";
import { readFileSync } from "fs";
import path from "path";
import jwt from "jsonwebtoken";
import { expressjwt as authMiddleware } from "express-jwt";
import multer from "multer";
import cors from "cors";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
// Secret key for signing and verifying JWT tokens
const jwtSecret = "agri_food_sc";
//express server
const app = express();
//configure cors
const corsOptions = {
  origin: ["http://localhost:5173"],
  credentials: true,
};
app.use(cors(corsOptions));

// Parse incoming request bodies in JSON format
app.use(bodyParser.json());
//Parse cookies in body
app.use(cookieParser());

//Paths to parent folders to store wallets
const currentFilePath = new URL(import.meta.url).pathname;
const currentDir = path.dirname(currentFilePath);
const parentDir = path.dirname(path.dirname(currentDir));

//used to upload certs and keys from users
const upload = multer({ dest: "./server/uploads/" });

//network config params
const channelName = "supplychain";
const chaincodeId = "basic";

// Create an authentication middleware function
authMiddleware({
  secret: jwtSecret,
  algorithms: ["HS256"],
  getToken: (req) => req.cookies.token,
});

//get token in cookie
app.get("/api/cookie", (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send("Unauthorized");
  }
  // Do something with the token
  res.send(token);
});
//function to upload certs
app.post("/upload/cert", upload.single("cert"), (req, res) => {
  res.json({ filename: req.file.filename });
});
//function to upload certs
app.post("/upload/key", upload.single("key"), (req, res) => {
  res.json({ filename: req.file.filename });
});
// Sign a new JWT token for the user
function signJwtToken(userId) {
  return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: "1h" });
}

// Authenticate the user with the authMiddleware function
app.get("/api/user", authMiddleware, (req, res) => {
  const userId = req.user.sub; // user ID from decoded JWT token
  // Use the user ID to fetch the user data from your database
  // ...
  res.json({ user: { id: userId, name: "John Doe" } });
});

// Log in the user and send a JWT token in a cookie
app.post("/api/auth", async (req, res) => {
  // save identity
  await loadIdentity(req.body);

  //connection profil file
  const connectionProfile = await yaml.load(
    readFileSync(process.cwd() + "/server/connections/agriFood.yaml", "utf8")
  );
  // Authenticate the user with the wallet
  const wallet = await Wallets.newFileSystemWallet(
    `./server/wallets/${req.body.mspId}/${req.body.identity}`
  );
  const gateway = new Gateway();
  const gatewayOptions = {
    identity: "userWallet", // Previously imported identity
    wallet,
  };
  try {
    gateway.connect(connectionProfile, gatewayOptions).then(() => {
      const jwtToken = signJwtToken(req.body.identity + "/" + req.body.mspId);
      gateway.disconnect();
      res.cookie("token", jwtToken, { httpOnly: true }).sendStatus(200);
    });
  } catch (error) {
    res.sendStatus(400);
  }
});

const loadIdentity = async (args) => {
  const { mspId, identity, cert, key } = args;
  const wallet = await Wallets.newFileSystemWallet(
    `./server/wallets/${mspId}/${identity}`
  );

  const Cert = readFileSync(`./server/uploads/${cert}`).toString();
  const Key = readFileSync(`./server/uploads/${key}`).toString();

  const identityLabel = "userWallet";
  const Identity = {
    credentials: {
      certificate: Cert,
      privateKey: Key,
    },
    mspId: mspId,
    type: "X.509",
  };

  await wallet.put(identityLabel, Identity);
};

app.get("/createCommodity", async (req, res) => {
  await loadIdentity();
  const connectionProfile = await yaml.load(
    readFileSync(process.cwd() + "/server/connections/agriFood.yaml", "utf8")
  );
  const wallet = await Wallets.newFileSystemWallet(
    "./server/identity/user/wallet"
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
