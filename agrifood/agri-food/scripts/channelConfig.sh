#!/bin/bash

ORG=""
CHANNEL=""
OUTPUT=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  key="$1"

  case $key in
    -o|--org)
      ORG="$2"
      shift # past argument
      shift # past value
      ;;
    -c|--channel)
      CHANNEL="$2"
      shift # past argument
      shift # past value
      ;;
    -out|--output)
      OUTPUT="$2"
      shift # past argument
      shift # past value
      ;;
    *)
      # unknown option
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Check if required parameters are provided
if [[ -z $ORG || -z $CHANNEL || -z $OUTPUT ]]; then
  echo "Missing required parameters."
  echo "Usage: ./script.sh -o <org> -c <channel> -out <output>"
  exit 1
fi

# Import utils
source scripts/envVar.sh

fetchChannelConfig() {
  ORG=$1
  CHANNEL=$2
  OUTPUT=$3

  setGlobals $ORG

  infoln "Fetching the most recent configuration block for the channel"
  set -x
  peer channel fetch config config_block.pb -o orderer.example.com:7050 --ordererTLSHostnameOverride orderer.example.com -c $CHANNEL --tls --cafile "$ORDERER_CA"
  { set +x; } 2>/dev/null

  infoln "Decoding config block to JSON and isolating config to ${OUTPUT}"
  set -x
  configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json
  jq .data.data[0].payload.data.config config_block.json >"${OUTPUT}"
  { set +x; } 2>/dev/null
}

channelConfig(){
    fetchChannelConfig $ORG $CHANNEL ${OUTPUT}
}

channelConfig
