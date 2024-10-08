import express from "express";
import { Wallets, Gateway } from "fabric-network";
import * as yaml from "js-yaml";
import { readFileSync, unlink } from "fs";
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
//use jwt middleware
app.use(
  authMiddleware({
    secret: jwtSecret,
    algorithms: ["HS256"],
    getToken: (req) => req.cookies.token,
  }).unless({
    path: ["/upload/cert", "/upload/key", "/api/auth"],
  })
);
//Paths to parent folders to store wallets
/* const currentFilePath = new URL(import.meta.url).pathname;
const currentDir = path.dirname(currentFilePath);
const parentDir = path.dirname(path.dirname(currentDir)); */

//used to upload certs and keys from users
const upload = multer({ dest: "./server/uploads/" });

//network config params
const channelName = "supplychain";
const chaincodeId = "basic";

//get token in cookie
app.get("/api/cookie", (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send("Unauthorized");
  }
  res.send(token);
});
//get msp in token
app.get("/api/msp", (req, res) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send("Unauthorized");
  } else {
    const Token = jwt.decode(token);
    res.send(Token.sub.split("/")[0]);
  }
});
//function to upload certs
app.post("/upload/cert", upload.single("cert"), (req, res) => {
  const filePath = req.file.path;

  // Schedule file deletion after 80 secs (80,000 ms)
  setTimeout(() => {
    unlink(filePath, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Deleted file ${filePath}`);
      }
    });
  }, 80000);
  res.json({ filename: req.file.filename });
});
//function to upload certs
app.post("/upload/key", upload.single("key"), (req, res) => {
  const filePath = req.file.path;

  // Schedule file deletion after 80 secs 80,000 ms)
  setTimeout(() => {
    unlink(filePath, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Deleted file ${filePath}`);
      }
    });
  }, 80000);
  res.json({ filename: req.file.filename });
});
// Sign a new JWT token for the user
function signJwtToken(userId) {
  return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: "10h" });
}

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
      const jwtToken = signJwtToken(req.body.mspId + "/" + req.body.identity);
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
//the token is provided to get path to user's wallet and verify connection
const getGateway = async (token) => {
  try {
    const params = jwt.decode(token).sub.split("/");
    const connectionProfile = await yaml.load(
      readFileSync(process.cwd() + "/server/connections/agriFood.yaml", "utf8")
    );
    const wallet = await Wallets.newFileSystemWallet(
      `./server/wallets/${params[0]}/${params[1]}`
    );
    const gateway = new Gateway();
    const gatewayOptions = {
      identity: "userWallet", // Previously imported identity
      wallet,
    };
    await gateway.connect(connectionProfile, gatewayOptions);
    return gateway;
  } catch (error) {
    return null;
  }
};

//create the commodity of the client
app.post("/api/create/commodity", async (req, res) => {
  const gateway = await getGateway(req.cookies.token);
  try {
    // Obtain the smart contract with which our application wants to interact
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeId);

    // Submit transactions for the smart contract
    const args = [req.body.id, req.body.origin, req.body.type];
    const submitResult = await contract.submitTransaction(
      "CreateCommodity",
      ...args
    );
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  } finally {
    // Disconnect from the gateway peer when all work for this client identity is complete
    gateway.disconnect();
  }
});
//create the commodity of the client
app.post("/api/create/commodityFraction", async (req, res) => {
  const gateway = await getGateway(req.cookies.token);
  try {
    // Obtain the smart contract with which our application wants to interact
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeId);

    // Submit transactions for the smart contract
    const args = [
      req.body.id,
      req.body.commodity,
      req.body.agreement,
      req.body.quantity,
    ];
    const submitResult = await contract.submitTransaction(
      "CreateCommodityFraction",
      ...args
    );
    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  } finally {
    // Disconnect from the gateway peer when all work for this client identity is complete
    gateway.disconnect();
  }
});
//api to get commodities of the authentified client
app.get("/api/get/commodity", async (req, res) => {
  const gateway = await getGateway(req.cookies.token);
  try {
    // Obtain the smart contract with which our application wants to interact
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeId);

    // Submit transactions for the smart contract
    const submitResult = await contract.evaluateTransaction(
      "GetFarmerCommodities"
    );
    const resultJSON = JSON.parse(submitResult.toString("utf8"));
    //console.log(resultJSON);
    res.status(200).json(resultJSON);
  } catch (error) {
    res.status(500).send("error invoking chaincode");
  } finally {
    // Disconnect from the gateway peer when all work for this client identity is complete
    gateway.disconnect();
  }
});
//api to get commodities of the authentified client
app.get("/api/get/commodityFraction", async (req, res) => {
  const gateway = await getGateway(req.cookies.token);
  try {
    // Obtain the smart contract with which our application wants to interact
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeId);

    // Submit transactions for the smart contract
    const submitResult = await contract.evaluateTransaction(
      "GetBrokerFractions"
    );
    const resultJSON = JSON.parse(submitResult.toString("utf8"));
    res.status(200).json(resultJSON);
  } catch (error) {
    console.log(error);
    res.status(500).send("error invoking chaincode");
  } finally {
    // Disconnect from the gateway peer when all work for this client identity is complete
    gateway.disconnect();
  }
});
//api to get agreements of the authentified client
app.get("/api/get/agreements", async (req, res) => {
  const gateway = await getGateway(req.cookies.token);
  try {
    // Obtain the smart contract with which our application wants to interact
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeId);

    // Submit transactions for the smart contract
    const submitResult = await contract.evaluateTransaction("GetAgreements");
    const resultJSON = JSON.parse(submitResult.toString("utf8"));
    res.status(200).json(resultJSON);
  } catch (error) {
    res.status(500).send("error invoking chaincode");
  } finally {
    // Disconnect from the gateway peer when all work for this client identity is complete
    gateway.disconnect();
  }
});
//api to get agreements of the authentified client
app.get("/api/get/agreements", async (req, res) => {
  const gateway = await getGateway(req.cookies.token);
  try {
    // Obtain the smart contract with which our application wants to interact
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeId);

    // Submit transactions for the smart contract
    const submitResult = await contract.evaluateTransaction("GetAgreements");
    const resultJSON = JSON.parse(submitResult.toString("utf8"));
    res.status(200).json(resultJSON);
  } catch (error) {
    res.status(500).send("error invoking chaincode");
  } finally {
    // Disconnect from the gateway peer when all work for this client identity is complete
    gateway.disconnect();
  }
});
//api to create an agreement for a specific commodity
app.post("/api/create/agreement", async (req, res) => {
  const gateway = await getGateway(req.cookies.token);
  try {
    // Obtain the smart contract with which our application wants to interact
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeId);

    // Submit transactions for the smart contract
    const args = [req.body.assetId, req.body.agreementId];
    const result = await contract.submitTransaction("CreateAgreement", ...args);
    const resultJSON = JSON.parse(result.toString("utf8"));
    if (resultJSON) res.sendStatus(200);
    else res.sendStatus(500);
  } catch (error) {
    res.sendStatus(500);
  } finally {
    // Disconnect from the gateway peer when all work for this client identity is complete
    gateway.disconnect();
  }
});
//api to push supplies in a commodity
app.post("/api/create/supply", async (req, res) => {
  const gateway = await getGateway(req.cookies.token);
  try {
    // Obtain the smart contract with which our application wants to interact
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeId);

    // Submit transactions for the smart contract
    const args = [
      req.body.agreement,
      req.body.commodity,
      req.body.id,
      req.body.type,
      req.body.quantity,
    ];
    const result = await contract.submitTransaction(
      "PushSuppliesToCommodity",
      ...args
    );
    const resultJSON = JSON.parse(result.toString("utf8"));
    if (resultJSON) res.sendStatus(200);
    else res.status(500).send("error creating the supply");
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    // Disconnect from the gateway peer when all work for this client identity is complete
    gateway.disconnect();
  }
});
//api to create a lot unit
app.post("/api/create/lotUnit", async (req, res) => {
  console.log(req.body);
  const gateway = await getGateway(req.cookies.token);
  try {
    // Obtain the smart contract with which our application wants to interact
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeId);

    // Submit transactions for the smart contract
    const args = [
      req.body.id,
      req.body.commodityFRC,
      req.body.agreement,
      req.body.lotNumber,
      req.body.quantity,
    ];
    const result = await contract.submitTransaction("CreateLotUnit", ...args);
    const resultJSON = JSON.parse(result.toString("utf8"));
    if (resultJSON) res.sendStatus(200);
    else res.status(500).send("error creating the lotUnit");
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    // Disconnect from the gateway peer when all work for this client identity is complete
    gateway.disconnect();
  }
});

//api to get agreements of the authentified client
app.get("/api/get/lotUnits", async (req, res) => {
  const gateway = await getGateway(req.cookies.token);
  try {
    // Obtain the smart contract with which our application wants to interact
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeId);

    // Submit transactions for the smart contract
    const submitResult = await contract.evaluateTransaction("GetLotUnits");
    const resultJSON = JSON.parse(submitResult.toString("utf8"));
    res.status(200).json(resultJSON);
  } catch (error) {
    res.status(500).send("error invoking chaincode");
  } finally {
    // Disconnect from the gateway peer when all work for this client identity is complete
    gateway.disconnect();
  }
});
//api to create a package
app.post("/api/create/package", async (req, res) => {
  const gateway = await getGateway(req.cookies.token);
  try {
    // Obtain the smart contract with which our application wants to interact
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeId);

    // Submit transactions for the smart contract
    const args = [req.body.id, req.body.lot];
    const result = await contract.submitTransaction("CreatePackage", ...args);
    const resultJSON = JSON.parse(result.toString("utf8"));
    if (resultJSON) res.sendStatus(200);
    else res.status(500).send("error creating the package");
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    // Disconnect from the gateway peer when all work for this client identity is complete
    gateway.disconnect();
  }
});
//api to update a package
app.post("/api/update/package", async (req, res) => {
  const gateway = await getGateway(req.cookies.token);
  try {
    // Obtain the smart contract with which our application wants to interact
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeId);

    // Submit transactions for the smart contract
    const args = [req.body.id];
    const result = await contract.submitTransaction("UpdatePackage", ...args);
    const resultJSON = JSON.parse(result.toString("utf8"));
    if (resultJSON) res.sendStatus(200);
    else res.status(500).send("error updating the package");
  } catch (error) {
    res.status(500).send(error.message);
  } finally {
    // Disconnect from the gateway peer when all work for this client identity is complete
    gateway.disconnect();
  }
});
//api to get agreements of the authentified client
app.get("/api/get/package", async (req, res) => {
  const gateway = await getGateway(req.cookies.token);
  try {
    // Obtain the smart contract with which our application wants to interact
    const network = await gateway.getNetwork(channelName);
    const contract = network.getContract(chaincodeId);

    // Submit transactions for the smart contract
    const args = [req.query.id];
    const submitResult = await contract.evaluateTransaction(
      "Getpackage",
      ...args
    );
    const resultJSON = JSON.parse(submitResult.toString("utf8"));
    res.status(200).json(resultJSON);
  } catch (error) {
    console.log(error);
    res.status(500).send(error);
  } finally {
    // Disconnect from the gateway peer when all work for this client identity is complete
    gateway.disconnect();
  }
});
app.listen(3000, () => {
  console.log("Server started on port 3000");
});
