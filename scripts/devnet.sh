#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

image=shardlabs/starknet-devnet:0.5.1

if [ "$(uname)" == "Darwin" ]; then
    image="${image}-arm"
fi

docker rm -f devnet
exec docker run --name devnet -p 127.0.0.1:5050:5050 ${image} --seed 0 --fork-retries 3 --fork-network alpha-goerli
