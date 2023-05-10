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
	Id           string `json:"id"`
	Owner        string `json:"owner"`
	AssetId      string `json:"asset_id"`
	CreatedDate  string `json:"created_date"`
	UsedBy       string `json:"used_by"`
	Organization string `json:"organization"`
	Consumed     bool   `json:"consumed"`
}

//this is asset is contains a fraction of the commodity

type CommodityFraction struct {
	Id          string  `json:"id"`
	Owner       string  `json:"owner"`
	CommodityId string  `json:"commodity_id"`
	AgreementId string  `json:"agreement_id"`
	Quantity    float64 `json:"quantity"`
	CreatedDate string  `json:"created_date"`
}

// this struct represents the asset of lot unit which contains the commodity fraction and the informations about it during manufacturing
type LotUnit struct {
	Id                  string  `json:"id"`
	Owner               string  `json:"owner"`
	CommodityFractionId string  `json:"commodity_fraction_id"`
	AgreementId         string  `json:"agreement_id"`
	LotNumber           string  `json:"lot_number"`
	Quantity            float64 `json:"quantity"`
	CreatedDate         string  `json:"created_date"`
}

//this struct contains all information about the package including its creation and transfert phases

type Package struct {
	Id          string          `json:"id"`
	Owner       string          `json:"owner"`
	LotUnitId   string          `json:"lotUnitId"`
	CreatedDate string          `json:"created_date"`
	Holders     []PackageHolder `json:"holders"`
}

// this struct contains the information about the package holder
type PackageHolder struct {
	Owner        string `json:"owner`
	Organization string `json:"organization"`
	HoldDate     string `json:"holdDate"`
}

//this struct contains for each commodity fraction,both the fraction and the commodity

type CommodityAndFraction struct {
	Commodity Commodity
	Fraction  CommodityFraction
}

//this struct contains all the trajectory of the package from the commodity to the last station in packages

type PackageTrace struct {
	CF  CommodityAndFraction
	Lot LotUnit
	Pkg Package
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

	if err != nil {
		return fmt.Errorf("failed to create composite key: %v", err)
	}
	*/
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
	//endorsingOrgs := []string{"FarmerMSP", "SupplierMSP", "BrokerMSP", "FactoryMSP"}
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

	assetBytes, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if assetBytes == nil {
		return nil, fmt.Errorf("the Assets wallet %s does not exist", id)
	}

	var asset AssetsWallet
	err = json.Unmarshal(assetBytes, &asset)
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
			Assets: []Asset{subAsset},
		}
		assetsBytes, _ := json.Marshal(asset)
		err = ctx.GetStub().PutState(owner, assetsBytes)
		if err != nil {
			return false, err
		}
		return true, nil
	}

	walletBytes, err := ctx.GetStub().GetState(owner)
	if err != nil {
		return false, err
	}
	var wallet AssetsWallet
	err = json.Unmarshal(walletBytes, &wallet)
	if err != nil {
		return false, err
	}
	if !s.doesNotContain(wallet.Assets, assetId) {
		return true, fmt.Errorf("the wallet already contains %s", assetId)
	}
	asset := Asset{Id: assetId, Type: assetType}
	wallet.Assets = append(wallet.Assets, asset)
	walletBytes, err = json.Marshal(wallet)
	if err != nil {
		return false, nil
	}
	ctx.GetStub().PutState(owner, walletBytes)

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
	walletBytes, err := ctx.GetStub().GetState(owner)
	if err != nil {
		return false, fmt.Errorf("asset doesn't exist: %v", err)
	}
	var wallet AssetsWallet
	err = json.Unmarshal(walletBytes, &wallet)
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
		Id:           agreementId,
		Owner:        owner,
		AssetId:      assetId,
		CreatedDate:  today,
		UsedBy:       "",
		Organization: "",
		Consumed:     false,
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

// the function is called to update agreement
func (s *SmartContract) UpdateAgreement(ctx contractapi.TransactionContextInterface, agreementId string, assetId string, owner string, creatorOrg string) (bool, error) {
	//get the agreement and verify that it is not consumed and its for the right product
	agreementBytes, err := ctx.GetStub().GetState(agreementId)
	if err != nil {
		return false, fmt.Errorf("failed to get agreement: %v", err)
	}
	var agreement Agreement
	err = json.Unmarshal(agreementBytes, &agreement)
	if err != nil {
		return false, fmt.Errorf("failed to unmarshal agreement JSON: %v", err)
	}
	if agreement.AssetId != assetId {
		return false, fmt.Errorf("this agreement doesn't belong to the provided commodity")
	} else if agreement.Consumed {
		return false, fmt.Errorf("this agreement is already consumed")
	}
	//set agreement as used
	agreement.UsedBy = owner
	agreement.Consumed = true
	agreement.Organization = creatorOrg
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

	//get the commodity to append the supplies
	commodityBytes, err := ctx.GetStub().GetState(commodityId)
	if err != nil {
		return false, fmt.Errorf("failed to get commodity: %v", err)
	}

	var commodity Commodity
	err = json.Unmarshal(commodityBytes, &commodity)
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
	//verify then the agreement before pushing changes
	agreementResult, err := s.UpdateAgreement(ctx, agreementId, commodityId, owner, creatorOrg)
	if !agreementResult {
		return false, err
	}
	//save back the commodity with new supply
	err = ctx.GetStub().PutState(commodity.Id, commodityJS)
	if err != nil {
		return false, err
	}
	//add the commodity to the wallet of supplier
	status, err := s.AppendToWallet(ctx, owner, commodityId, "supply~commodity")
	if !status {
		return false, err
	}

	return true, nil
}

// createCommodity fraction
func (s *SmartContract) CreateCommodityFraction(ctx contractapi.TransactionContextInterface, id string, commodityId string, agreementId string, quantity float64) (bool, error) {
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
	if creatorOrg != "BrokerMSP" {
		return false, fmt.Errorf("only members of BrokerMSP can create commodity fractions")
	}

	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}
	if exists {
		return false, fmt.Errorf("the commodity fraction %s already exists", id)
	}
	//create the commodity fraction
	var today = time.Now().UTC().Format("2006-01-02")

	commodityFraction := &CommodityFraction{
		Id:          id,
		Owner:       owner,
		CommodityId: commodityId,
		Quantity:    quantity,
		AgreementId: agreementId,
		CreatedDate: today,
	}
	//to json
	commodityFractionJSON, err := json.Marshal(commodityFraction)
	if err != nil {
		return false, err
	}
	//verify then the agreement before pushing changes
	agreementResult, err := s.UpdateAgreement(ctx, agreementId, commodityId, owner, creatorOrg)
	if !agreementResult {
		return false, err
	}
	//save the commodity fraction in world state
	err = ctx.GetStub().PutState(id, commodityFractionJSON)
	if err != nil {
		return false, err
	}
	//add the commodity to the wallet of broker
	status, err := s.AppendToWallet(ctx, owner, id, "commodityFraction")
	if !status {
		return false, err
	}

	return true, nil
}

// create lot unit
func (s *SmartContract) CreateLotUnit(ctx contractapi.TransactionContextInterface, id string, commodityFractionId string, agreementId string, lotNumber string, quantity float64) (bool, error) {
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
	if creatorOrg != "FactoryMSP" {
		return false, fmt.Errorf("only members of FactoryMSP can create lot units")
	}
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}
	if exists {
		return false, fmt.Errorf("the lot unit %s already exists", id)
	}
	//create the commodity fraction
	var today = time.Now().UTC().Format("2006-01-02")

	lotUnit := &LotUnit{
		Id:                  id,
		Owner:               owner,
		CommodityFractionId: commodityFractionId,
		Quantity:            quantity,
		AgreementId:         agreementId,
		LotNumber:           lotNumber,
		CreatedDate:         today,
	}
	//to json
	lotUnitJSON, err := json.Marshal(lotUnit)
	if err != nil {
		return false, err
	}
	//verify then the agreement before pushing changes
	agreementResult, err := s.UpdateAgreement(ctx, agreementId, commodityFractionId, owner, creatorOrg)
	if !agreementResult {
		return false, err
	}
	//save the commodity fraction in world state
	err = ctx.GetStub().PutState(id, lotUnitJSON)
	if err != nil {
		return false, err
	}
	//add the commodity to the wallet of broker
	status, err := s.AppendToWallet(ctx, owner, id, "lotUnit")
	if !status {
		return false, err
	}

	return true, nil
}

// CreatePackage a function to create a package that's scanned by the factory
func (s *SmartContract) CreatePackage(ctx contractapi.TransactionContextInterface, id string, lotUnit string) (bool, error) {
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
	if creatorOrg != "FactoryMSP" {
		return false, fmt.Errorf("only members of FactoryMSP can create lot units")
	}

	//check if the package doesn't exist already
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}
	if exists {
		return false, fmt.Errorf("the package %s already exists", id)
	}

	//create the package
	var today = time.Now().UTC().Format("2006-01-02")

	pkg := &Package{
		Id:          id,
		Owner:       owner,
		LotUnitId:   lotUnit,
		CreatedDate: today,
		Holders:     make([]PackageHolder, 0, 3),
	}
	//to json
	pkgJSON, err := json.Marshal(pkg)
	if err != nil {
		return false, err
	}
	//save the package in world state
	err = ctx.GetStub().PutState(id, pkgJSON)
	if err != nil {
		return false, err
	}
	return true, nil
}

// function to update the scanned package and append holder's informations to it
func (s *SmartContract) UpdatePackage(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
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
	//check if the package exists
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}
	if !exists {
		return false, fmt.Errorf("the the package %s doesn't exist", id)
	}
	//get the package to append the holder
	packageBytes, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to get the package: %v", err)
	}

	var pkg Package
	err = json.Unmarshal(packageBytes, &pkg)
	if err != nil {
		return false, fmt.Errorf("failed to unmarshal package JSON: %v", err)
	}

	// check if the member didn't scan the package already
	for _, holder := range pkg.Holders {
		if holder.Owner == owner {
			return false, fmt.Errorf("the package is already scanned by this member")

		}
	}
	var today = time.Now().UTC().Format("2006-01-02")

	pkgHolder := &PackageHolder{
		Owner:        owner,
		Organization: creatorOrg,
		HoldDate:     today,
	}
	//append the holder to the package
	pkg.Holders = append(pkg.Holders, *pkgHolder)
	pkgJSON, err := json.Marshal(pkg)
	if err != nil {
		return false, err
	}
	//save the package in world state
	err = ctx.GetStub().PutState(id, pkgJSON)
	if err != nil {
		return false, err
	}
	return true, nil
}

// function to retreive the full trajectory of the package
func (s *SmartContract) Getpackage(ctx contractapi.TransactionContextInterface, id string) (*PackageTrace, error) {
	//check if the package exists
	exists, err := s.AssetExists(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if !exists {
		return nil, fmt.Errorf("the the package %s doesn't exist", id)
	}
	//get the package
	packageBytes, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to get the package: %v", err)
	}

	pkgTrace := &PackageTrace{}
	var pkg Package
	var cf CommodityAndFraction
	var lot LotUnit
	err = json.Unmarshal(packageBytes, &pkg)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal package JSON: %v", err)
	}
	//get the lot Unit
	lotUnitBytes, err := ctx.GetStub().GetState(pkg.LotUnitId)
	if err != nil {
		return nil, fmt.Errorf("failed to get the lot: %v", err)
	}
	err = json.Unmarshal(lotUnitBytes, &lot)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal lotUnit JSON: %v", err)
	}
	//get the commodity fraction
	cfBytes, err := ctx.GetStub().GetState(lot.CommodityFractionId)
	if err != nil {
		return nil, fmt.Errorf("failed to get the commodity fraction: %v", err)
	}
	err = json.Unmarshal(cfBytes, &cf.Fraction)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal commodity fraction JSON: %v", err)
	}
	//get the commodity
	commBytes, err := ctx.GetStub().GetState(cf.Fraction.CommodityId)
	if err != nil {
		return nil, fmt.Errorf("failed to get the commodity : %v", err)
	}
	err = json.Unmarshal(commBytes, &cf.Commodity)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal commodity JSON: %v", err)
	}
	//fill in package tracer
	pkgTrace.Pkg = pkg
	pkgTrace.CF = cf
	pkgTrace.Lot = lot

	return pkgTrace, nil
}

// GetLotUnits returns the lot units owned by the invoking factory.
func (s *SmartContract) GetLotUnits(ctx contractapi.TransactionContextInterface) ([]*LotUnit, error) {
	var lotUnits []*LotUnit

	// Get the owner ID
	ownerID, err := cid.GetID(ctx.GetStub())
	if err != nil {
		return nil, fmt.Errorf("failed to get owner ID: %v", err)
	}

	// Get the owner's wallet
	walletBytes, err := ctx.GetStub().GetState(ownerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get owner wallet: %v", err)
	}

	var wallet AssetsWallet
	err = json.Unmarshal(walletBytes, &wallet)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal wallet JSON: %v", err)
	}

	// Get the commodities owned by the owner
	for _, asset := range wallet.Assets {
		if asset.Type == "lotUnit" {
			lotUnitBytes, err := ctx.GetStub().GetState(asset.Id)
			if err != nil {
				return nil, fmt.Errorf("failed to get lot unit with ID %s: %v", asset.Id, err)
			}

			var lotUnit LotUnit
			err = json.Unmarshal(lotUnitBytes, &lotUnit)
			if err != nil {
				return nil, fmt.Errorf("failed to unmarshal commodity JSON: %v", err)
			}

			lotUnits = append(lotUnits, &lotUnit)
		}
	}

	return lotUnits, nil
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
	walletBytes, err := ctx.GetStub().GetState(ownerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get owner wallet: %v", err)
	}

	var wallet AssetsWallet
	err = json.Unmarshal(walletBytes, &wallet)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal wallet JSON: %v", err)
	}

	// Get the commodities owned by the owner
	for _, asset := range wallet.Assets {
		if asset.Type == "commodity" {
			commodityBytes, err := ctx.GetStub().GetState(asset.Id)
			if err != nil {
				return nil, fmt.Errorf("failed to get commodity with ID %s: %v", asset.Id, err)
			}

			var commodity Commodity
			err = json.Unmarshal(commodityBytes, &commodity)
			if err != nil {
				return nil, fmt.Errorf("failed to unmarshal commodity JSON: %v", err)
			}

			commodities = append(commodities, &commodity)
		}
	}

	return commodities, nil
}

//get the commodity fractions

// GetBrokerFractions returns the fractions of commodities owned by the invoking broker dealer.
func (s *SmartContract) GetBrokerFractions(ctx contractapi.TransactionContextInterface) ([]*CommodityAndFraction, error) {
	var commodityAndFraction []*CommodityAndFraction

	// Get the owner ID
	ownerID, err := cid.GetID(ctx.GetStub())
	if err != nil {
		return nil, fmt.Errorf("failed to get owner ID: %v", err)
	}

	// Get the owner's wallet
	walletBytes, err := ctx.GetStub().GetState(ownerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get owner wallet: %v", err)
	}

	var wallet AssetsWallet
	err = json.Unmarshal(walletBytes, &wallet)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal wallet JSON: %v", err)
	}

	// Get the commodities owned by the owner
	for _, asset := range wallet.Assets {
		if asset.Type == "commodityFraction" {
			commodityFcBytes, err := ctx.GetStub().GetState(asset.Id)
			if err != nil {
				return nil, fmt.Errorf("failed to get commodity fraction with ID %s: %v", asset.Id, err)
			}
			//get the commodity fraction
			var commodityFc CommodityFraction
			var commodity Commodity
			err = json.Unmarshal(commodityFcBytes, &commodityFc)
			if err != nil {
				return nil, fmt.Errorf("failed to unmarshal commodity fraction JSON: %v", err)
			}
			//get the commodity
			commodityBytes, err := ctx.GetStub().GetState(commodityFc.CommodityId)
			if err != nil {
				return nil, fmt.Errorf("failed to get commodity with ID %s: %v", asset.Id, err)
			}
			err = json.Unmarshal(commodityBytes, &commodity)
			if err != nil {
				return nil, fmt.Errorf("failed to unmarshal commodity fraction JSON: %v", err)
			}
			//the struct to hold both commodity fraction and commodity
			var commodityFC CommodityAndFraction
			commodityFC.Commodity = commodity
			commodityFC.Fraction = commodityFc
			commodityAndFraction = append(commodityAndFraction, &commodityFC)
		}
	}

	return commodityAndFraction, nil
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
	walletBytes, err := ctx.GetStub().GetState(ownerID)
	if err != nil {
		return nil, fmt.Errorf("failed to get owner wallet: %v", err)
	}

	var wallet AssetsWallet
	err = json.Unmarshal(walletBytes, &wallet)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal wallet JSON: %v", err)
	}

	// Get the commodities owned by the owner
	for _, asset := range wallet.Assets {
		if asset.Type == "agreement" {
			agreementBytes, err := ctx.GetStub().GetState(asset.Id)
			if err != nil {
				return nil, fmt.Errorf("failed to get commodity with ID %s: %v", asset.Id, err)
			}

			var agreement Agreement
			err = json.Unmarshal(agreementBytes, &agreement)
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
