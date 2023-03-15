package main

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing an Asset
type SmartContract struct {
	contractapi.Contract
}

// Asset describes basic details of what makes up a simple asset
type Commodity struct {
	ID             string    `json:"ID"`
	Origin         string    `json:"origin"`
	Type           string    `json:"type"`
	SupplyDate     time.Time `json:"supply_date"`
	ExpirationDate time.Time `json:"expiration_date"`
}

func (s *SmartContract) CreateCommodity(ctx contractapi.TransactionContextInterface, id string, origin string, materialType string, supplyDate string, expirationDate string) error {
	ctx.GetStub().SetTransient()
	var today = time.Now().UTC().Format("YYYY-MM-DD")
	assetKey, err := ctx.GetStub().CreateCompositeKey("commodity", []string{id, today})
	if err != nil {
		return fmt.Errorf("failed to create composite key: %v", err)
	}
	exists, err := s.CommodityExists(ctx, assetKey)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if exists {
		return fmt.Errorf("the commodity %s already exists", assetKey)
	}
	sp_date, err := time.Parse("2006-01-02", supplyDate)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	exp_date, err := time.Parse("2006-01-02", expirationDate)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	commodity := &Commodity{
		ID:             id,
		Origin:         origin,
		Type:           materialType,
		SupplyDate:     sp_date,
		ExpirationDate: exp_date,
	}

	commodityJSON, err := json.Marshal(commodity)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(assetKey, commodityJSON)
	if err != nil {
		return err
	}
	return nil

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

// ReadAsset returns the asset stored in the world state with given id.
func (s *SmartContract) GetCommodityById(ctx contractapi.TransactionContextInterface, id string) (*Commodity, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if assetJSON == nil {
		return nil, fmt.Errorf("the RM asset %s does not exist", id)
	}

	var asset Commodity
	err = json.Unmarshal(assetJSON, &asset)
	if err != nil {
		return nil, err
	}

	return &asset, nil
}

// AssetExists returns true when asset with given ID exists in world state
func (s *SmartContract) CommodityExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return assetJSON != nil, nil
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