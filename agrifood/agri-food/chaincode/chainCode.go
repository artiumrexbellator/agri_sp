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
	Id          string   `json:"id"`
	Owner       string   `json:"owner"`
	Origin      string   `json:"origin"`
	Type        string   `json:"type"`
	CreatedDate string   `json:"created_date"`
	Supplies    []Supply `json:"supplies"`
}

// asset that contains supplies
type Supply struct {
	Id          string `json:"id"`
	Owner       string `json:"owner"`
	Type        string `json:"type"`
	Quantity    int    `json:"quantity"`
	Agreement   string `json:"agreement"`
	CreatedDate string `json:"created_date"`
}

// asset type used to identify the asset in the wallet
type Asset struct {
	Id   string `json:"id"`
	Type string `json:"type"`
}

// This asset holds all the assets of an owner for fast indexing
type AssetsWallet struct {
	Id     string  `json:"id"`
	Assets []Asset `json:"assets"`
}

// this asset contains agreements to change on assets
type Agreement struct {
	Id          string `json:"id"`
	Owner       string `json:"owner"`
	AssetId     string `json:"asset_id"`
	CreatedDate string `json:"created_date"`
	UsedBy      string `json:"used_by"`
	Consumed    bool   `json:"consumed"`
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
	/* assetKey, err := ctx.GetStub().CreateCompositeKey("commodity", []string{id})
	if err != nil {
		return fmt.Errorf("failed creating the key: %v", err)
	}
	*/
	if err != nil {
		return fmt.Errorf("failed to create composite key: %v", err)
	}

	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if exists {
		return fmt.Errorf("the commodity %s already exists", id)
	}
	//get owner ID
	var owner string = ""
	owner, err = cid.GetID(ctx.GetStub())
	if err != nil {
		return fmt.Errorf("ownerId error: %v", err)
	}
	/*
		exp_date, err := time.Parse("2006-01-02", expirationDate)
		if err != nil {
			return fmt.Errorf("wrong expiration date: %v", err)
		} */
	commodity := &Commodity{
		Id:          id,
		Owner:       owner,
		Origin:      origin,
		Type:        materialType,
		CreatedDate: today,
		Supplies:    make([]Supply, 0, 2),
	}

	commodityJSON, err := json.Marshal(commodity)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(id, commodityJSON)
	if err != nil {
		return err
	}

	//add the asset to owner's wallet
	s.AppendToWallet(ctx, owner, id, "commodity")
	// Changes the endorsement policy to the new owner org
	endorsingOrgs := []string{creatorOrg}
	err = setAssetStateBasedEndorsement(ctx, id, endorsingOrgs)
	if err != nil {
		return fmt.Errorf("failed setting state based endorsement for new owner: %v", err)
	}
	return nil

}

//read The wallet of assets

func (s *SmartContract) GetAssetsWallet(ctx contractapi.TransactionContextInterface, id string) (*AssetsWallet, error) {
	//get the owner first
	owner, err := cid.GetID(ctx.GetStub())
	if err != nil {
		return nil, fmt.Errorf("ownerId error: %v", err)
	}

	//if the invoker is not the owner then stop it
	if owner != id {
		return nil, fmt.Errorf("ownerId error: %v", err)
	}

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
			Id:     owner,
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
		return true, fmt.Errorf("the wallet already contains %s", assetId)
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

// creates new agreement
func (s *SmartContract) CreateAgreement(ctx contractapi.TransactionContextInterface, assetId string, agreementId string) (bool, error) {
	//get the owner first
	owner, err := cid.GetID(ctx.GetStub())
	if err != nil {
		return false, fmt.Errorf("ownerId error: %v", err)
	}
	//get the wallet of user
	walletJSON, err := ctx.GetStub().GetState(owner)
	if err != nil {
		return false, fmt.Errorf("asset doesn't exist: %v", err)
	}
	var wallet AssetsWallet
	err = json.Unmarshal(walletJSON, &wallet)
	if err != nil {
		return false, err
	}
	//check if the asset exists in the wallet
	if s.doesNotContain(wallet.Assets, assetId) {
		return false, fmt.Errorf("the wallet doesn't contain the asset %s", assetId)
	}

	var today = time.Now().UTC().Format("2006-01-02")

	//create the agreement
	agreement := &Agreement{
		Id:          agreementId,
		Owner:       owner,
		AssetId:     assetId,
		CreatedDate: today,
		UsedBy:      "",
		Consumed:    false,
	}

	agreementJSON, err := json.Marshal(agreement)
	if err != nil {
		return false, err
	}

	err = ctx.GetStub().PutState(agreementId, agreementJSON)
	if err != nil {
		return false, err
	}
	//add the agreement to the wallet of owner
	status, err := s.AppendToWallet(ctx, owner, agreementId, "agreement")
	if err != nil || !status {
		return false, err
	}
	return true, nil
}

// push supplies to a commodity
func (s *SmartContract) PushSuppliesToCommodity(ctx contractapi.TransactionContextInterface, agreementId string, commodityId string, supplyId string, supplyType string, quantity int) (bool, error) {
	//get the owner first
	owner, err := cid.GetID(ctx.GetStub())
	if err != nil {
		return false, fmt.Errorf("ownerId error: %v", err)
	}
	// Check invoking user identity
	creatorOrg, err := cid.GetMSPID(ctx.GetStub())
	if err != nil {
		return false, fmt.Errorf("failed to get MSP ID: %v", err)
	}
	if creatorOrg != "SupplierMSP" {
		return false, fmt.Errorf("only members of SupplierMSP can push supplies to commodities")
	}
	//get the agreement and verify that it is not consumed and its for the right product
	agreementJSON, err := ctx.GetStub().GetState(agreementId)
	if err != nil {
		return false, fmt.Errorf("failed to get agreement: %v", err)
	}

	var agreement Agreement
	err = json.Unmarshal(agreementJSON, &agreement)
	if err != nil {
		return false, fmt.Errorf("failed to unmarshal agreement JSON: %v", err)
	}
	if agreement.AssetId != commodityId {
		return false, fmt.Errorf("this agreement doesn't belong to the provided commodity")
	} else if agreement.Consumed {
		return false, fmt.Errorf("this agreement is already consumed")
	}

	//get the commodity to append the supplies
	commodityJSON, err := ctx.GetStub().GetState(commodityId)
	if err != nil {
		return false, fmt.Errorf("failed to get commodity: %v", err)
	}

	var commodity Commodity
	err = json.Unmarshal(commodityJSON, &commodity)
	if err != nil {
		return false, fmt.Errorf("failed to unmarshal commodity JSON: %v", err)
	}

	//create the supply
	var today = time.Now().UTC().Format("2006-01-02")

	supply := &Supply{
		Id:          supplyId,
		Owner:       owner,
		Type:        supplyType,
		Quantity:    quantity,
		Agreement:   agreementId,
		CreatedDate: today,
	}
	//append the supply to the commodity
	commodity.Supplies = append(commodity.Supplies, *supply)
	commodityJS, err := json.Marshal(commodity)
	if err != nil {
		return false, err
	}
	//save back the commodity with new supply
	err = ctx.GetStub().PutState(commodity.Id, commodityJS)
	if err != nil {
		return false, err
	}
	//add the commodity to the wallet of owner
	status, err := s.AppendToWallet(ctx, owner, commodityId, "supply~commodity")
	if !status {
		return false, err
	}
	//set agreement as used
	agreement.UsedBy = owner
	agreement.Consumed = true
	agreementJS, err := json.Marshal(agreement)
	if err != nil {
		return false, err
	}
	//save back the agreement with new changes
	err = ctx.GetStub().PutState(agreement.Id, agreementJS)
	if err != nil {
		return false, err
	}

	return true, nil
}

// GetFarmerCommodities returns the commodities owned by the invoking farmer.
func (s *SmartContract) GetFarmerCommodities(ctx contractapi.TransactionContextInterface) ([]*Commodity, error) {
	var commodities []*Commodity

	// Get the owner ID
	ownerID, err := cid.GetID(ctx.GetStub())
	if err != nil {
		return nil, fmt.Errorf("failed to get owner ID: %v", err)
	}

	// Get the owner's wallet
	walletJSON, err := ctx.GetStub().GetState(ownerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get owner wallet: %v", err)
	}

	var wallet AssetsWallet
	err = json.Unmarshal(walletJSON, &wallet)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal wallet JSON: %v", err)
	}

	// Get the commodities owned by the owner
	for _, asset := range wallet.Assets {
		if asset.Type == "commodity" {
			commodityJSON, err := ctx.GetStub().GetState(asset.Id)
			if err != nil {
				return nil, fmt.Errorf("failed to get commodity with ID %s: %v", asset.Id, err)
			}

			var commodity Commodity
			err = json.Unmarshal(commodityJSON, &commodity)
			if err != nil {
				return nil, fmt.Errorf("failed to unmarshal commodity JSON: %v", err)
			}

			commodities = append(commodities, &commodity)
		}
	}

	return commodities, nil
}

// GetFarmerCommodities returns the commodities owned by the invoking farmer.
func (s *SmartContract) GetAgreements(ctx contractapi.TransactionContextInterface) ([]*Agreement, error) {
	var agreements []*Agreement

	// Get the owner ID
	ownerID, err := cid.GetID(ctx.GetStub())
	if err != nil {
		return nil, fmt.Errorf("failed to get owner ID: %v", err)
	}

	// Get the owner's wallet
	walletJSON, err := ctx.GetStub().GetState(ownerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get owner wallet: %v", err)
	}

	var wallet AssetsWallet
	err = json.Unmarshal(walletJSON, &wallet)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal wallet JSON: %v", err)
	}

	// Get the commodities owned by the owner
	for _, asset := range wallet.Assets {
		if asset.Type == "agreement" {
			agreementJSON, err := ctx.GetStub().GetState(asset.Id)
			if err != nil {
				return nil, fmt.Errorf("failed to get commodity with ID %s: %v", asset.Id, err)
			}

			var agreement Agreement
			err = json.Unmarshal(agreementJSON, &agreement)
			if err != nil {
				return nil, fmt.Errorf("failed to unmarshal commodity JSON: %v", err)
			}

			agreements = append(agreements, &agreement)
		}
	}

	return agreements, nil
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
