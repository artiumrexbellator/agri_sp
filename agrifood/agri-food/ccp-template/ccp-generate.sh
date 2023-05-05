#!/bin/bash

function one_line_pem {
    echo "`awk 'NF {sub(/\\n/, ""); printf "%s\\\\\\\n",$0;}' $1`"
}

function json_ccp {
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ccp-template/ccp-template.json
}

function yaml_ccp {
    local PP=$(one_line_pem $5)
    local CP=$(one_line_pem $6)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${MSP}/$2/" \
        -e "s/\${P0PORT}/$3/" \
        -e "s/\${CAPORT}/$4/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ccp-template/ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

ORG=supplier
MSP=Supplier
P0PORT=7051
CAPORT=7054
PEERPEM=organizations/peerOrganizations/supplier.com/tlsca/tlsca.supplier.com-cert.pem
CAPEM=organizations/peerOrganizations/supplier.com/ca/ca.supplier.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/supplier.com/connection-supplier.json
echo "$(yaml_ccp $ORG $MSP $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/supplier.com/connection-supplier.yaml

ORG=farmer
MSP=Farmer
P0PORT=8051
CAPORT=8054
PEERPEM=organizations/peerOrganizations/farmer.com/tlsca/tlsca.farmer.com-cert.pem
CAPEM=organizations/peerOrganizations/farmer.com/ca/ca.farmer.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/farmer.com/connection-farmer.json
echo "$(yaml_ccp $ORG $MSP $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/farmer.com/connection-farmer.yaml

ORG=broker
MSP=Broker
P0PORT=6051
CAPORT=6054
PEERPEM=organizations/peerOrganizations/broker.com/tlsca/tlsca.broker.com-cert.pem
CAPEM=organizations/peerOrganizations/broker.com/ca/ca.broker.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/broker.com/connection-broker.json
echo "$(yaml_ccp $ORG $MSP $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/broker.com/connection-broker.yaml

ORG=factory
MSP=Factory
P0PORT=5051
CAPORT=5054
PEERPEM=organizations/peerOrganizations/factory.com/tlsca/tlsca.factory.com-cert.pem
CAPEM=organizations/peerOrganizations/factory.com/ca/ca.factory.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/factory.com/connection-factory.json
echo "$(yaml_ccp $ORG $MSP $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/factory.com/connection-factory.yaml

ORG=distributor
MSP=Distributor
P0PORT=4051
CAPORT=4054
PEERPEM=organizations/peerOrganizations/distributor.com/tlsca/tlsca.distributor.com-cert.pem
CAPEM=organizations/peerOrganizations/distributor.com/ca/ca.distributor.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/distributor.com/connection-distributor.json
echo "$(yaml_ccp $ORG $MSP $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/distributor.com/connection-distributor.yaml

ORG=wholesaler
MSP=Wholesaler
P0PORT=3051
CAPORT=3054
PEERPEM=organizations/peerOrganizations/wholesaler.com/tlsca/tlsca.wholesaler.com-cert.pem
CAPEM=organizations/peerOrganizations/wholesaler.com/ca/ca.wholesaler.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/wholesaler.com/connection-wholesaler.json
echo "$(yaml_ccp $ORG $MSP $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/wholesaler.com/connection-wholesaler.yaml

ORG=retailer
MSP=Retailer
P0PORT=2051
CAPORT=2054
PEERPEM=organizations/peerOrganizations/retailer.com/tlsca/tlsca.retailer.com-cert.pem
CAPEM=organizations/peerOrganizations/retailer.com/ca/ca.retailer.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/retailer.com/connection-retailer.json
echo "$(yaml_ccp $ORG $MSP $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/retailer.com/connection-retailer.yaml
