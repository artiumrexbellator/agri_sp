package main

import (
  "log"
  "encoding/json"
  "fmt"
  "github.com/hyperledger/fabric-contract-api-go/contractapi"
  "time"
)

// SmartContract provides functions for managing an Asset
   type SmartContract struct {
   contractapi.Contract
   }

   // Asset describes basic details of what makes up a simple asset
   type RawMaterial struct {
    ID             string `json:"ID"`
	Origin         string    `json:"origin"`
	Type           string    `json:"type"`
	SupplyDate     time.Time `json:"supply_date"`
	ExpirationDate time.Time `json:"expiration_date"`
   }

   func (s *SmartContract) CreateRawMaterial(ctx contractapi.TransactionContextInterface,id string, origin string, materialType string, supplyDate string, expirationDate string) error {
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	if exists {
		return fmt.Errorf("the raw material %s already exists", id)
	}
    sp_date, err := time.Parse("2006-01-02", supplyDate)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	exp_date, err := time.Parse("2006-01-02", expirationDate)
	if err != nil {
		return fmt.Errorf("failed to read from world state: %v", err)
	}
	rawMaterial := &RawMaterial{
		ID:            id,
		Origin:        origin,
		Type:          materialType,
		SupplyDate:    sp_date,
		ExpirationDate: exp_date,
	}

	rawMaterialJSON, err := json.Marshal(rawMaterial)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(id, rawMaterialJSON)
	if err != nil {
		return err
	}

	return nil

}

// ReadAsset returns the asset stored in the world state with given id.
func (s *SmartContract) ReadRMAsset(ctx contractapi.TransactionContextInterface, id string) (*RawMaterial, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
    if err != nil {
      return nil, fmt.Errorf("failed to read from world state: %v", err)
    }
    if assetJSON == nil {
      return nil, fmt.Errorf("the RM asset %s does not exist", id)
    }

    var asset RawMaterial
    err = json.Unmarshal(assetJSON, &asset)
    if err != nil {
      return nil, err
    }

    return &asset, nil
  }

  // AssetExists returns true when asset with given ID exists in world state
  func (s *SmartContract) AssetExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	assetJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
	  return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return assetJSON != nil, nil
  }

// GetAllAssets returns all assets found in world state
func (s *SmartContract) GetAllRMAssets(ctx contractapi.TransactionContextInterface) ([]*RawMaterial, error) {
	// range query with empty string for startKey and endKey does an
	// open-ended query of all assets in the chaincode namespace.
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var assets []*RawMaterial
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var asset RawMaterial
		err = json.Unmarshal(queryResponse.Value, &asset)
		if err != nil {
			return nil, err
		}
		assets = append(assets, &asset)
	}

	return assets, nil
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