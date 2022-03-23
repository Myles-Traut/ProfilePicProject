const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { ethers } = require("hardhat");
const fs = require('fs');

const privateKeyData = fs.readFileSync("./scripts/privateKeys.csv", "utf8");
let pks = privateKeyData.split(",\n");

let signerWallet1 = new ethers.Wallet(pks[0], ethers.provider);
let signerWallet2 = new ethers.Wallet(pks[1], ethers.provider);
let signerWallet3 = new ethers.Wallet(pks[2], ethers.provider);
let signerWallet4 = new ethers.Wallet(pks[3], ethers.provider);
let signerWallet5 = new ethers.Wallet(pks[4], ethers.provider);
let signerWallet6 = new ethers.Wallet(pks[5], ethers.provider);
let signerWallet7 = new ethers.Wallet(pks[6], ethers.provider);
let signerWallet8 = new ethers.Wallet(pks[7], ethers.provider);


// console.log(signerWallet);
let walletAddresses = [
    signerWallet1.address,
    signerWallet2.address,
    signerWallet3.address,
    signerWallet4.address,
    signerWallet5.address,
    signerWallet6.address,
    signerWallet7.address,
    signerWallet8.address
];

let leafNodes = walletAddresses.map(addr => keccak256(addr));

const merkletree = new MerkleTree(leafNodes, keccak256, {sortPairs : true});

let rootHash = merkletree.getRoot();

let buyer1 = leafNodes[0];
let buyer2 = leafNodes[1];
let buyer3 = leafNodes[2];
let buyer4 = leafNodes[3];
let buyer5 = leafNodes[4];
let buyer6 = leafNodes[5];
let buyer7 = leafNodes[6];
let buyer8 = leafNodes[7];

let buyer1MerkleProof = merkletree.getHexProof(buyer1);
let buyer2MerkleProof = merkletree.getHexProof(buyer2);
let buyer3MerkleProof = merkletree.getHexProof(buyer3);
let buyer4MerkleProof = merkletree.getHexProof(buyer4);
let buyer5MerkleProof = merkletree.getHexProof(buyer5);
let buyer6MerkleProof = merkletree.getHexProof(buyer6);
let buyer7MerkleProof = merkletree.getHexProof(buyer7);
let buyer8MerkleProof = merkletree.getHexProof(buyer8);

rootHash = rootHash.toString("hex");

module.exports = { 
    walletAddresses,
    merkletree,
    leafNodes,
    rootHash,
    signerWallet1,
    signerWallet2,
    buyer1MerkleProof,
    buyer2MerkleProof,
    buyer3MerkleProof,
    buyer4MerkleProof,
    buyer5MerkleProof,
    buyer6MerkleProof,
    buyer7MerkleProof,
    buyer8MerkleProof
}; 


