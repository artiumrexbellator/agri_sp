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
    local PP=$(one_line_pem $4)
    local CP=$(one_line_pem $5)
    sed -e "s/\${ORG}/$1/" \
        -e "s/\${P0PORT}/$2/" \
        -e "s/\${CAPORT}/$3/" \
        -e "s#\${PEERPEM}#$PP#" \
        -e "s#\${CAPEM}#$CP#" \
        ccp-template/ccp-template.yaml | sed -e $'s/\\\\n/\\\n          /g'
}

ORG=supplier
P0PORT=7051
CAPORT=7054
PEERPEM=organizations/peerOrganizations/supplier.example.com/tlsca/tlsca.supplier.example.com-cert.pem
CAPEM=organizations/peerOrganizations/supplier.example.com/ca/ca.supplier.example.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/supplier.example.com/connection-supplier.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/supplier.example.com/connection-supplier.yaml

ORG=farmer
P0PORT=9051
CAPORT=8054
PEERPEM=organizations/peerOrganizations/farmer.example.com/tlsca/tlsca.farmer.example.com-cert.pem
CAPEM=organizations/peerOrganizations/farmer.example.com/ca/ca.farmer.example.com-cert.pem

echo "$(json_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/farmer.example.com/connection-farmer.json
echo "$(yaml_ccp $ORG $P0PORT $CAPORT $PEERPEM $CAPEM)" > organizations/peerOrganizations/farmer.example.com/connection-farmer.yaml
