#!/bin/bash

# Set the workspace to the current directory
WORKSPACE=$(pwd)

# Parse command-line arguments
while getopts ":hb:n:" opt; do
  case $opt in
    b)
      BENCH_CONFIG="$OPTARG"
      ;;
    n)
      NETWORK_CONFIG="$OPTARG"
      ;;
    h)
      echo "Usage: $0 [-b <benchmark_config>] [-n <network_config>]"
      echo "  -b <benchmark_config>: The path to the benchmark configuration file"
      echo "  -n <network_config>: The path to the network configuration file"
      exit 0
      ;;
    \?)
      echo "Invalid option: -$OPTARG" >&2
      exit 1
      ;;
    :)
      echo "Option -$OPTARG requires an argument." >&2
      exit 1
      ;;
  esac
done

# Launch the Caliper manager
npx caliper launch manager \
  --caliper-workspace $WORKSPACE \
  --caliper-benchconfig $BENCH_CONFIG \
  --caliper-networkconfig $NETWORK_CONFIG
