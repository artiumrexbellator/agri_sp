#!/bin/bash

function createSupplier() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/supplier.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/supplier.com/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:7054 --caname ca-supplier --tls.certfiles "${PWD}/organizations/fabric-ca/supplier/ca-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-supplier.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-supplier.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-supplier.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-7054-ca-supplier.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/peerOrganizations/supplier.com/msp/config.yaml"

  # Since the CA serves as both the organization CA and TLS CA, copy the org's root cert that was generated by CA startup into the org level ca and tlsca directories

  # Copy supplier's CA cert to supplier's /msp/tlscacerts directory (for use in the channel MSP definition)
  mkdir -p "${PWD}/organizations/peerOrganizations/supplier.com/msp/tlscacerts"
  cp "${PWD}/organizations/fabric-ca/supplier/ca-cert.pem" "${PWD}/organizations/peerOrganizations/supplier.com/msp/tlscacerts/ca.crt"

  # Copy supplier's CA cert to supplier's /tlsca directory (for use by clients)
  mkdir -p "${PWD}/organizations/peerOrganizations/supplier.com/tlsca"
  cp "${PWD}/organizations/fabric-ca/supplier/ca-cert.pem" "${PWD}/organizations/peerOrganizations/supplier.com/tlsca/tlsca.supplier.com-cert.pem"

  # Copy supplier's CA cert to supplier's /ca directory (for use by clients)
  mkdir -p "${PWD}/organizations/peerOrganizations/supplier.com/ca"
  cp "${PWD}/organizations/fabric-ca/supplier/ca-cert.pem" "${PWD}/organizations/peerOrganizations/supplier.com/ca/ca.supplier.com-cert.pem"

  infoln "Registering peer0"
  set -x
  fabric-ca-client register --caname ca-supplier --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/supplier/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca-supplier --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/organizations/fabric-ca/supplier/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-supplier --id.name supplieradmin --id.secret supplieradminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/supplier/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-supplier -M "${PWD}/organizations/peerOrganizations/supplier.com/peers/peer0.supplier.com/msp" --csr.hosts peer0.supplier.com --tls.certfiles "${PWD}/organizations/fabric-ca/supplier/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/supplier.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/supplier.com/peers/peer0.supplier.com/msp/config.yaml"

  infoln "Generating the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:7054 --caname ca-supplier -M "${PWD}/organizations/peerOrganizations/supplier.com/peers/peer0.supplier.com/tls" --enrollment.profile tls --csr.hosts peer0.supplier.com --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/supplier/ca-cert.pem"
  { set +x; } 2>/dev/null

  # Copy the tls CA cert, server cert, server keystore to well known file names in the peer's tls directory that are referenced by peer startup config
  cp "${PWD}/organizations/peerOrganizations/supplier.com/peers/peer0.supplier.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/supplier.com/peers/peer0.supplier.com/tls/ca.crt"
  cp "${PWD}/organizations/peerOrganizations/supplier.com/peers/peer0.supplier.com/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/supplier.com/peers/peer0.supplier.com/tls/server.crt"
  cp "${PWD}/organizations/peerOrganizations/supplier.com/peers/peer0.supplier.com/tls/keystore/"* "${PWD}/organizations/peerOrganizations/supplier.com/peers/peer0.supplier.com/tls/server.key"

  infoln "Generating the user msp"
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:7054 --caname ca-supplier -M "${PWD}/organizations/peerOrganizations/supplier.com/users/User1@supplier.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/supplier/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/supplier.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/supplier.com/users/User1@supplier.com/msp/config.yaml"

  infoln "Generating the org admin msp"
  set -x
  fabric-ca-client enroll -u https://supplieradmin:supplieradminpw@localhost:7054 --caname ca-supplier -M "${PWD}/organizations/peerOrganizations/supplier.com/users/Admin@supplier.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/supplier/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/supplier.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/supplier.com/users/Admin@supplier.com/msp/config.yaml"
}

function createFarmer() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/farmer.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/farmer.com/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:8054 --caname ca-farmer --tls.certfiles "${PWD}/organizations/fabric-ca/farmer/ca-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-farmer.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-farmer.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-farmer.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-8054-ca-farmer.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/peerOrganizations/farmer.com/msp/config.yaml"

  # Since the CA serves as both the organization CA and TLS CA, copy the org's root cert that was generated by CA startup into the org level ca and tlsca directories

  # Copy farmer's CA cert to farmer's /msp/tlscacerts directory (for use in the channel MSP definition)
  mkdir -p "${PWD}/organizations/peerOrganizations/farmer.com/msp/tlscacerts"
  cp "${PWD}/organizations/fabric-ca/farmer/ca-cert.pem" "${PWD}/organizations/peerOrganizations/farmer.com/msp/tlscacerts/ca.crt"

  # Copy farmer's CA cert to farmer's /tlsca directory (for use by clients)
  mkdir -p "${PWD}/organizations/peerOrganizations/farmer.com/tlsca"
  cp "${PWD}/organizations/fabric-ca/farmer/ca-cert.pem" "${PWD}/organizations/peerOrganizations/farmer.com/tlsca/tlsca.farmer.com-cert.pem"

  # Copy farmer's CA cert to farmer's /ca directory (for use by clients)
  mkdir -p "${PWD}/organizations/peerOrganizations/farmer.com/ca"
  cp "${PWD}/organizations/fabric-ca/farmer/ca-cert.pem" "${PWD}/organizations/peerOrganizations/farmer.com/ca/ca.farmer.com-cert.pem"

  infoln "Registering peer0"
  set -x
  fabric-ca-client register --caname ca-farmer --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/farmer/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca-farmer --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/organizations/fabric-ca/farmer/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-farmer --id.name farmeradmin --id.secret farmeradminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/farmer/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca-farmer -M "${PWD}/organizations/peerOrganizations/farmer.com/peers/peer0.farmer.com/msp" --csr.hosts peer0.farmer.com --tls.certfiles "${PWD}/organizations/fabric-ca/farmer/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/farmer.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/farmer.com/peers/peer0.farmer.com/msp/config.yaml"

  infoln "Generating the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:8054 --caname ca-farmer -M "${PWD}/organizations/peerOrganizations/farmer.com/peers/peer0.farmer.com/tls" --enrollment.profile tls --csr.hosts peer0.farmer.com --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/farmer/ca-cert.pem"
  { set +x; } 2>/dev/null

  # Copy the tls CA cert, server cert, server keystore to well known file names in the peer's tls directory that are referenced by peer startup config
  cp "${PWD}/organizations/peerOrganizations/farmer.com/peers/peer0.farmer.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/farmer.com/peers/peer0.farmer.com/tls/ca.crt"
  cp "${PWD}/organizations/peerOrganizations/farmer.com/peers/peer0.farmer.com/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/farmer.com/peers/peer0.farmer.com/tls/server.crt"
  cp "${PWD}/organizations/peerOrganizations/farmer.com/peers/peer0.farmer.com/tls/keystore/"* "${PWD}/organizations/peerOrganizations/farmer.com/peers/peer0.farmer.com/tls/server.key"

  infoln "Generating the user msp"
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:8054 --caname ca-farmer -M "${PWD}/organizations/peerOrganizations/farmer.com/users/User1@farmer.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/farmer/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/farmer.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/farmer.com/users/User1@farmer.com/msp/config.yaml"

  infoln "Generating the org admin msp"
  set -x
  fabric-ca-client enroll -u https://farmeradmin:farmeradminpw@localhost:8054 --caname ca-farmer -M "${PWD}/organizations/peerOrganizations/farmer.com/users/Admin@farmer.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/farmer/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/farmer.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/farmer.com/users/Admin@farmer.com/msp/config.yaml"
}

function createBroker() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/peerOrganizations/broker.com/

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/broker.com/

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:6054 --caname ca-broker --tls.certfiles "${PWD}/organizations/fabric-ca/broker/ca-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-6054-ca-broker.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-6054-ca-broker.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-6054-ca-broker.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-6054-ca-broker.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/peerOrganizations/broker.com/msp/config.yaml"

  # Since the CA serves as both the organization CA and TLS CA, copy the org's root cert that was generated by CA startup into the org level ca and tlsca directories

  # Copy broker's CA cert to broker's /msp/tlscacerts directory (for use in the channel MSP definition)
  mkdir -p "${PWD}/organizations/peerOrganizations/broker.com/msp/tlscacerts"
  cp "${PWD}/organizations/fabric-ca/broker/ca-cert.pem" "${PWD}/organizations/peerOrganizations/broker.com/msp/tlscacerts/ca.crt"

  # Copy broker's CA cert to broker's /tlsca directory (for use by clients)
  mkdir -p "${PWD}/organizations/peerOrganizations/broker.com/tlsca"
  cp "${PWD}/organizations/fabric-ca/broker/ca-cert.pem" "${PWD}/organizations/peerOrganizations/broker.com/tlsca/tlsca.broker.com-cert.pem"

  # Copy broker's CA cert to broker's /ca directory (for use by clients)
  mkdir -p "${PWD}/organizations/peerOrganizations/broker.com/ca"
  cp "${PWD}/organizations/fabric-ca/broker/ca-cert.pem" "${PWD}/organizations/peerOrganizations/broker.com/ca/ca.broker.com-cert.pem"

  infoln "Registering peer0"
  set -x
  fabric-ca-client register --caname ca-broker --id.name peer0 --id.secret peer0pw --id.type peer --tls.certfiles "${PWD}/organizations/fabric-ca/broker/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering user"
  set -x
  fabric-ca-client register --caname ca-broker --id.name user1 --id.secret user1pw --id.type client --tls.certfiles "${PWD}/organizations/fabric-ca/broker/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering the org admin"
  set -x
  fabric-ca-client register --caname ca-broker --id.name brokeradmin --id.secret brokeradminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/broker/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the peer0 msp"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:6054 --caname ca-broker -M "${PWD}/organizations/peerOrganizations/broker.com/peers/peer0.broker.com/msp" --csr.hosts peer0.broker.com --tls.certfiles "${PWD}/organizations/fabric-ca/broker/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/broker.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/broker.com/peers/peer0.broker.com/msp/config.yaml"

  infoln "Generating the peer0-tls certificates"
  set -x
  fabric-ca-client enroll -u https://peer0:peer0pw@localhost:6054 --caname ca-broker -M "${PWD}/organizations/peerOrganizations/broker.com/peers/peer0.broker.com/tls" --enrollment.profile tls --csr.hosts peer0.broker.com --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/broker/ca-cert.pem"
  { set +x; } 2>/dev/null

  # Copy the tls CA cert, server cert, server keystore to well known file names in the peer's tls directory that are referenced by peer startup config
  cp "${PWD}/organizations/peerOrganizations/broker.com/peers/peer0.broker.com/tls/tlscacerts/"* "${PWD}/organizations/peerOrganizations/broker.com/peers/peer0.broker.com/tls/ca.crt"
  cp "${PWD}/organizations/peerOrganizations/broker.com/peers/peer0.broker.com/tls/signcerts/"* "${PWD}/organizations/peerOrganizations/broker.com/peers/peer0.broker.com/tls/server.crt"
  cp "${PWD}/organizations/peerOrganizations/broker.com/peers/peer0.broker.com/tls/keystore/"* "${PWD}/organizations/peerOrganizations/broker.com/peers/peer0.broker.com/tls/server.key"

  infoln "Generating the user msp"
  set -x
  fabric-ca-client enroll -u https://user1:user1pw@localhost:6054 --caname ca-broker -M "${PWD}/organizations/peerOrganizations/broker.com/users/User1@broker.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/broker/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/broker.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/broker.com/users/User1@broker.com/msp/config.yaml"

  infoln "Generating the org admin msp"
  set -x
  fabric-ca-client enroll -u https://brokeradmin:brokeradminpw@localhost:6054 --caname ca-broker -M "${PWD}/organizations/peerOrganizations/broker.com/users/Admin@broker.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/broker/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/peerOrganizations/broker.com/msp/config.yaml" "${PWD}/organizations/peerOrganizations/broker.com/users/Admin@broker.com/msp/config.yaml"
}

function createOrderer() {
  infoln "Enrolling the CA admin"
  mkdir -p organizations/ordererOrganizations/example.com

  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/ordererOrganizations/example.com

  set -x
  fabric-ca-client enroll -u https://admin:adminpw@localhost:9054 --caname ca-orderer --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  echo 'NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/localhost-9054-ca-orderer.pem
    OrganizationalUnitIdentifier: orderer' > "${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml"

  # Since the CA serves as both the organization CA and TLS CA, copy the org's root cert that was generated by CA startup into the org level ca and tlsca directories

  # Copy orderer org's CA cert to orderer org's /msp/tlscacerts directory (for use in the channel MSP definition)
  mkdir -p "${PWD}/organizations/ordererOrganizations/example.com/msp/tlscacerts"
  cp "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem" "${PWD}/organizations/ordererOrganizations/example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

  # Copy orderer org's CA cert to orderer org's /tlsca directory (for use by clients)
  mkdir -p "${PWD}/organizations/ordererOrganizations/example.com/tlsca"
  cp "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem" "${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem"

  infoln "Registering orderer"
  set -x
  fabric-ca-client register --caname ca-orderer --id.name orderer --id.secret ordererpw --id.type orderer --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Registering the orderer admin"
  set -x
  fabric-ca-client register --caname ca-orderer --id.name ordererAdmin --id.secret ordererAdminpw --id.type admin --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  infoln "Generating the orderer msp"
  set -x
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp" --csr.hosts orderer.example.com --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml" "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/config.yaml"

  infoln "Generating the orderer-tls certificates"
  set -x
  fabric-ca-client enroll -u https://orderer:ordererpw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls" --enrollment.profile tls --csr.hosts orderer.example.com --csr.hosts localhost --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  # Copy the tls CA cert, server cert, server keystore to well known file names in the orderer's tls directory that are referenced by orderer startup config
  cp "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt"
  cp "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/signcerts/"* "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt"
  cp "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/keystore/"* "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key"

  # Copy orderer org's CA cert to orderer's /msp/tlscacerts directory (for use in the orderer MSP definition)
  mkdir -p "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts"
  cp "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/tlscacerts/"* "${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem"

  infoln "Generating the admin msp"
  set -x
  fabric-ca-client enroll -u https://ordererAdmin:ordererAdminpw@localhost:9054 --caname ca-orderer -M "${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp" --tls.certfiles "${PWD}/organizations/fabric-ca/ordererOrg/ca-cert.pem"
  { set +x; } 2>/dev/null

  cp "${PWD}/organizations/ordererOrganizations/example.com/msp/config.yaml" "${PWD}/organizations/ordererOrganizations/example.com/users/Admin@example.com/msp/config.yaml"
}
