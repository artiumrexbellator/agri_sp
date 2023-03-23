package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hyperledger/fabric-chaincode-go/pkg/cid"
	"github.com/hyperledger/fabric-chaincode-go/pkg/statebased"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing an Asset
type SmartContract struct {
	contractapi.Contract
}

// Asset describes basic details of what makes up a simple asset
type Commodity struct {
	Origin     string `json:"origin"`
	Type       string `json:"type"`
	CreateDate string `json:"create_date"`
}

// asset type used to identify the asset in the wallet
type Asset struct {
	Id   string `json:"id"`
	Type string `json:"type"`
}

// This asset holds all the assets of an owner for fast searching
type AssetsWallet struct {
	Assets []Asset `json:"assets"`
}

func (s *SmartContract) CreateCommodity(ctx contractapi.TransactionContextInterface, id string, origin string, materialType string) error {
	// Check invoking user identity
	creatorOrg, err := cid.GetMSPID(ctx.GetStub())
	if err != nil {
		return fmt.Errorf("failed to get MSP ID: %v", err)
	}
	if creatorOrg != "FarmerMSP" {
		return fmt.Errorf("only members of FarmerMSP can create commodities")
	}

	var today = time.Now().UTC().Format("2006-01-02")
	assetKey, err := ctx.GetStub().CreateCompositeKey("commodity", []string{id})
	if err != nil {
		return fmt.Errorf("failed creating the key: %v", err)
	}

	if err != nil {
		return fmt.Errorf("failed to create composite key: %v", err)
	}

	exists, err := s.AssetExists(ctx, assetKey)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if exists {
		return fmt.Errorf("the commodity %s already exists", assetKey)
	}

	/*
		exp_date, err := time.Parse("2006-01-02", expirationDate)
		if err != nil {
			return fmt.Errorf("wrong expiration date: %v", err)
		} */
	commodity := &Commodity{
		Origin:     origin,
		Type:       materialType,
		CreateDate: today,
	}

	commodityJSON, err := json.Marshal(commodity)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(assetKey, commodityJSON)
	if err != nil {
		return err
	}
	//get owner ID
	var owner string = ""
	owner, err = cid.GetID(ctx.GetStub())
	if err != nil {
		return fmt.Errorf("ownerId error: %v", err)
	}
	//add the asset to owner's wallet
	s.AppendToWallet(ctx, owner, id, "commodity")
	// Changes the endorsement policy to the new owner org
	endorsingOrgs := []string{creatorOrg}
	err = setAssetStateBasedEndorsement(ctx, assetKey, endorsingOrgs)
	if err != nil {
		return fmt.Errorf("failed setting state based endorsement for new owner: %v", err)
	}
	return nil

}

//read The wallet of assets

func (s *SmartContract) GetAssetsWallet(ctx contractapi.TransactionContextInterface, id string) (*AssetsWallet, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if assetJSON == nil {
		return nil, fmt.Errorf("the Assets wallet %s does not exist", id)
	}

	var asset AssetsWallet
	err = json.Unmarshal(assetJSON, &asset)
	if err != nil {
		return nil, err
	}

	return &asset, nil
}

// check wallet assets for redundancy
func (s *SmartContract) doesNotContain(arr []Asset, ss string) bool {
	for _, str := range arr {
		if str.Id == ss {
			return false
		}
	}
	return true
}

// append asset to wallet
func (s *SmartContract) AppendToWallet(ctx contractapi.TransactionContextInterface, owner string, assetId string, assetType string) (bool, error) {
	//check the wallet of the creator
	walletExist, err := s.AssetExists(ctx, owner)
	if err != nil {
		return false, err
	}
	if !walletExist {
		subAsset := Asset{Id: assetId, Type: assetType}
		asset := &AssetsWallet{
			Assets: make([]Asset, 0, 2),
		}
		asset.Assets = append(asset.Assets, subAsset)
		jsonAssets, _ := json.Marshal(asset)
		err = ctx.GetStub().PutState(owner, jsonAssets)
		if err != nil {
			return false, err
		}
		return true, nil
	}

	walletJSON, err := ctx.GetStub().GetState(owner)
	if err != nil {
		return false, err
	}
	var wallet AssetsWallet
	err = json.Unmarshal(walletJSON, &wallet)
	if err != nil {
		return false, err
	}
	if !s.doesNotContain(wallet.Assets, assetId) {
		return false, fmt.Errorf("the wallet already contains %s", assetId)
	}
	asset := Asset{Id: assetId, Type: assetType}
	wallet.Assets = append(wallet.Assets, asset)
	walletJSON, err = json.Marshal(wallet)
	if err != nil {
		return false, nil
	}
	ctx.GetStub().PutState(owner, walletJSON)

	return true, nil
}

// ReadAsset returns the asset stored in the world state with given id.
func (s *SmartContract) GetFarmerCommodities(ctx contractapi.TransactionContextInterface, id string) ([]*Commodity, error) {

	// Execute the GetStateByPartialCompositeKey query and retrieve the query result iterator
	queryResultIterator, err := ctx.GetStub().GetStateByPartialCompositeKey("commodity", []string{id})
	if err != nil {
		return nil, fmt.Errorf("failed to execute query: %v", err)
	}
	defer queryResultIterator.Close()

	// Loop through the query result iterator and build a slice of assets that match the partial composite key
	var matchingAssets []*Commodity
	for queryResultIterator.HasNext() {
		queryResult, err := queryResultIterator.Next()
		if err != nil {
			return nil, fmt.Errorf("failed to retrieve query result: %v", err)
		}

		_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(queryResult.Key)
		if err != nil {
			return nil, fmt.Errorf("failed to split composite key: %v", err)
		}

		var asset Commodity
		err = json.Unmarshal(queryResult.Value, &asset)
		if err != nil {
			return nil, fmt.Errorf("failed to unmarshal asset: %v", err)
		}

		// Check that the retrieved asset has the correct color prefix
		if compositeKeyParts[0] == id {
			matchingAssets = append(matchingAssets, &asset)
		}
	}

	// Return the matching assets as JSON
	return matchingAssets, nil
}

// AssetExists returns true when asset with given ID exists in world state
func (s *SmartContract) AssetExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return assetJSON != nil, nil
}

// setAssetStateBasedEndorsement adds an endorsement policy to an asset so that the passed orgs need to agree upon transfer
func setAssetStateBasedEndorsement(ctx contractapi.TransactionContextInterface, assetID string, orgsToEndorse []string) error {
	endorsementPolicy, err := statebased.NewStateEP(nil)
	if err != nil {
		return err
	}
	err = endorsementPolicy.AddOrgs(statebased.RoleTypePeer, orgsToEndorse...)
	if err != nil {
		return fmt.Errorf("failed to add org to endorsement policy: %v", err)
	}
	policy, err := endorsementPolicy.Policy()
	if err != nil {
		return fmt.Errorf("failed to create endorsement policy bytes from org: %v", err)
	}
	err = ctx.GetStub().SetStateValidationParameter(assetID, policy)
	if err != nil {
		return fmt.Errorf("failed to set validation parameter on asset: %v", err)
	}

	return nil
}

func main() {
	assetChaincode, err := contractapi.NewChaincode(&SmartContract{})
	if err != nil {
		log.Panicf("Error creating supply chain chaincode: %v", err)
	}

	if err := assetChaincode.Start(); err != nil {
		log.Panicf("Error starting supply chain chaincode: %v", err)
	}
}
