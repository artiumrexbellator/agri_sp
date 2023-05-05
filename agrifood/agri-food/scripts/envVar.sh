#!/bin/bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This is a collection of bash functions used by different scripts

# imports
. scripts/utils.sh

export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem
export PEER0_SUPPLIER_CA=${PWD}/organizations/peerOrganizations/supplier.com/tlsca/tlsca.supplier.com-cert.pem
export PEER0_FARMER_CA=${PWD}/organizations/peerOrganizations/farmer.com/tlsca/tlsca.farmer.com-cert.pem
export PEER0_BROKER_CA=${PWD}/organizations/peerOrganizations/broker.com/tlsca/tlsca.broker.com-cert.pem
export PEER0_FACTORY_CA=${PWD}/organizations/peerOrganizations/factory.com/tlsca/tlsca.factory.com-cert.pem
export PEER0_DISTRIBUTOR_CA=${PWD}/organizations/peerOrganizations/distributor.com/tlsca/tlsca.distributor.com-cert.pem
export PEER0_WHOLESALER_CA=${PWD}/organizations/peerOrganizations/wholesaler.com/tlsca/tlsca.wholesaler.com-cert.pem
export PEER0_RETAILER_CA=${PWD}/organizations/peerOrganizations/retailer.com/tlsca/tlsca.retailer.com-cert.pem
export PEER0_ORG3_CA=${PWD}/organizations/peerOrganizations/org3.example.com/tlsca/tlsca.org3.example.com-cert.pem
export ORDERER_ADMIN_TLS_SIGN_CERT=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt
export ORDERER_ADMIN_TLS_PRIVATE_KEY=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key

# Set environment variables for the peer org
setGlobals() {
  local USING_ORG=""
  if [ -z "$OVERRIDE_ORG" ]; then
    USING_ORG=$1
  else
    USING_ORG="${OVERRIDE_ORG}"
  fi
  infoln "Using organization ${USING_ORG}"
  if [ $USING_ORG == "supplier" ]; then
    export CORE_PEER_LOCALMSPID="SupplierMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_SUPPLIER_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/supplier.com/users/Admin@supplier.com/msp
    export CORE_PEER_ADDRESS=localhost:7051
  elif [ $USING_ORG == "farmer" ]; then
    export CORE_PEER_LOCALMSPID="FarmerMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_FARMER_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/farmer.com/users/Admin@farmer.com/msp
    export CORE_PEER_ADDRESS=localhost:8051
  elif [ $USING_ORG == "broker" ]; then
    export CORE_PEER_LOCALMSPID="BrokerMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_BROKER_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/broker.com/users/Admin@broker.com/msp
    export CORE_PEER_ADDRESS=localhost:6051
  elif [ $USING_ORG == "factory" ]; then
    export CORE_PEER_LOCALMSPID="FactoryMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_FACTORY_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/factory.com/users/Admin@factory.com/msp
    export CORE_PEER_ADDRESS=localhost:5051
  elif [ $USING_ORG == "distributor" ]; then
    export CORE_PEER_LOCALMSPID="DistributorMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_DISTRIBUTOR_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/distributor.com/users/Admin@distributor.com/msp
    export CORE_PEER_ADDRESS=localhost:4051
  elif [ $USING_ORG == "wholesaler" ]; then
    export CORE_PEER_LOCALMSPID="WholesalerMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_WHOLESALER_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/wholesaler.com/users/Admin@wholesaler.com/msp
    export CORE_PEER_ADDRESS=localhost:3051
  elif [ $USING_ORG == "retailer" ]; then
    export CORE_PEER_LOCALMSPID="RetailerMSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_RETAILER_CA
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/retailer.com/users/Admin@retailer.com/msp
    export CORE_PEER_ADDRESS=localhost:2051
  #elif [ $USING_ORG == 3 ]; then
    #export CORE_PEER_LOCALMSPID="Org3MSP"
    #export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG3_CA
    #export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/#users/Admin@org3.example.com/msp
    #export CORE_PEER_ADDRESS=localhost:11051
  else
    errorln "ORG Unknown"
  fi

  if [ "$VERBOSE" == "true" ]; then
    env | grep CORE
  fi
}

# Set environment variables for use in the CLI container
setGlobalsCLI() {
  setGlobals $1

  local USING_ORG=""
  if [ -z "$OVERRIDE_ORG" ]; then
    USING_ORG=$1
  else
    USING_ORG="${OVERRIDE_ORG}"
  fi
  if [ $USING_ORG == "supplier" ]; then
    export CORE_PEER_ADDRESS=peer0.supplier.com:7051
  elif [ $USING_ORG == "farmer" ]; then
    export CORE_PEER_ADDRESS=peer0.farmer.com:8051
  elif [ $USING_ORG == "broker" ]; then
    export CORE_PEER_ADDRESS=peer0.broker.com:6051
  elif [ $USING_ORG == "factory" ]; then
    export CORE_PEER_ADDRESS=peer0.factory.com:5051
  elif [ $USING_ORG == "distributor" ]; then
    export CORE_PEER_ADDRESS=peer0.distributor.com:4051
  elif [ $USING_ORG == "wholesaler" ]; then
    export CORE_PEER_ADDRESS=peer0.wholesaler.com:3051
  elif [ $USING_ORG == "retailer" ]; then
    export CORE_PEER_ADDRESS=peer0.retailer.com:2051
  elif [ $USING_ORG == "other" ]; then
    export CORE_PEER_ADDRESS=peer0.org3.example.com:11051
  else
    errorln "ORG Unknown"
  fi
}

# parsePeerConnectionParameters $@
# Helper function that sets the peer connection parameters for a chaincode
# operation
parsePeerConnectionParameters() {
  PEER_CONN_PARMS=()
  PEERS=""
  while [ "$#" -gt 0 ]; do
    setGlobals $1
    PEER="peer0.$1"
    ## Set peer addresses
    if [ -z "$PEERS" ]
    then
	PEERS="$PEER"
    else
	PEERS="$PEERS $PEER"
    fi
    PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" --peerAddresses $CORE_PEER_ADDRESS)
    ## Set path to TLS certificate
    CA=PEER0_$(echo "$1" | tr '[:lower:]' '[:upper:]')_CA
    TLSINFO=(--tlsRootCertFiles "${!CA}")
    PEER_CONN_PARMS=("${PEER_CONN_PARMS[@]}" "${TLSINFO[@]}")
    # shift by one to get to the next organization
    shift
  done
}

verifyResult() {
  if [ $1 -ne 0 ]; then
    fatalln "$2"
  fi
}
