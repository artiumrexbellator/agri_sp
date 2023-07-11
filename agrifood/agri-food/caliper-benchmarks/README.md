# Hyperledger Caliper Benchmarks

This repository contains benchmarks that may be used by Caliper, a blockchain performance benchmark framework. For more information on Caliper, please see the [Caliper main repository](https://github.com/hyperledger/caliper/)

Associated performance reports, based on running these benchmarks, are published to the [repository github pages](https://hyperledger.github.io/caliper-benchmarks/).


The benchmarks contained within the dev branch are split into three directories:

1. **benchmarks**. Comprises the test configuration and callback files. The test configuration files describe the benchmark test parameters and also reference the callback files that are executed by Caliper clients during the benchmark. The Benchmark folder contains the following subfolder:
    - **basicSc** Tests directed towards the API of a single target blockchain.
2. **networks**. Comprises sample blockchain networks that may be used as target systems under test (SUT) for benchmarking purposes.

## Running a Benchmark

npx caliper launch manager \
    --caliper-bind-sut fabric:2.4 \
    --caliper-workspace . \
    --caliper-benchconfig benchmarks/basicSc/createComConf.yaml \
    --caliper-networkconfig networks/fabric/farmerNetworkConf.yaml