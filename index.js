"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ethers_1 = require("ethers");
const merkletreejs_1 = require("merkletreejs");
const localProviderUrl = 'http://localhost:8545';
const contractAddress = '0xd53e9530107a8d8856099d7d80126478d48e06dA';
const startBlock = 3475961;
const endBlock = 'latest';
const localProvider = new ethers_1.ethers.JsonRpcProvider(localProviderUrl);
const ABI = [
    {
        constant: true,
        inputs: [],
        name: 'name',
        outputs: [
            {
                name: '',
                type: 'string',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                name: '_spender',
                type: 'address',
            },
            {
                name: '_value',
                type: 'uint256',
            },
        ],
        name: 'approve',
        outputs: [
            {
                name: '',
                type: 'bool',
            },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'totalSupply',
        outputs: [
            {
                name: '',
                type: 'uint256',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                name: '_from',
                type: 'address',
            },
            {
                name: '_to',
                type: 'address',
            },
            {
                name: '_value',
                type: 'uint256',
            },
        ],
        name: 'transferFrom',
        outputs: [
            {
                name: '',
                type: 'bool',
            },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'decimals',
        outputs: [
            {
                name: '',
                type: 'uint8',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: true,
        inputs: [
            {
                name: '_owner',
                type: 'address',
            },
        ],
        name: 'balanceOf',
        outputs: [
            {
                name: 'balance',
                type: 'uint256',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: true,
        inputs: [],
        name: 'symbol',
        outputs: [
            {
                name: '',
                type: 'string',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        constant: false,
        inputs: [
            {
                name: '_to',
                type: 'address',
            },
            {
                name: '_value',
                type: 'uint256',
            },
        ],
        name: 'transfer',
        outputs: [
            {
                name: '',
                type: 'bool',
            },
        ],
        payable: false,
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        constant: true,
        inputs: [
            {
                name: '_owner',
                type: 'address',
            },
            {
                name: '_spender',
                type: 'address',
            },
        ],
        name: 'allowance',
        outputs: [
            {
                name: '',
                type: 'uint256',
            },
        ],
        payable: false,
        stateMutability: 'view',
        type: 'function',
    },
    {
        payable: true,
        stateMutability: 'payable',
        type: 'fallback',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'owner',
                type: 'address',
            },
            {
                indexed: true,
                name: 'spender',
                type: 'address',
            },
            {
                indexed: false,
                name: 'value',
                type: 'uint256',
            },
        ],
        name: 'Approval',
        type: 'event',
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                name: 'from',
                type: 'address',
            },
            {
                indexed: true,
                name: 'to',
                type: 'address',
            },
            {
                indexed: false,
                name: 'value',
                type: 'uint256',
            },
        ],
        name: 'Transfer',
        type: 'event',
    },
];
function getTransactionLogs() {
    return __awaiter(this, void 0, void 0, function* () {
        const contract = new ethers_1.ethers.Contract(contractAddress, ABI, localProvider);
        const filter = contract.filters.Transfer;
        const events = yield contract.queryFilter(filter, startBlock, endBlock);
        // @ts-ignore
        const addressesRaw = events.map((event) => [event.args[0], event.args[1]]);
        const addresses = [...new Set(addressesRaw.flat())];
        const balanceOf = {};
        const balanceOfPromises = [];
        addresses.forEach((addr) => {
            const balancePromise = contract
                .balanceOf(addr)
                .then((balance) => [addr, (0, ethers_1.formatUnits)(balance, 6)]);
            balanceOfPromises.push(balancePromise);
        });
        const balanceOfResults = yield Promise.all(balanceOfPromises);
        const filteredBalanceOfResults = balanceOfResults.filter(([_, balance]) => parseFloat(balance) !== 0);
        filteredBalanceOfResults.forEach(([addr, balance]) => {
            balanceOf[addr] = balance;
        });
        return { addresses, balanceOfResults, balanceOf };
    });
}
// ------------------------------------------------------------------ MERKLE TREE
function getMerkleProof(tree, address) {
    const hashedAddress = (0, ethers_1.keccak256)(address);
    return tree.getHexProof(hashedAddress);
}
// ------------------------------------------------------------------ MAIN
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const { addresses, balanceOfResults, balanceOf } = yield getTransactionLogs();
        console.log('addresses:', addresses);
        const tree = new merkletreejs_1.MerkleTree(addresses.map(ethers_1.keccak256), ethers_1.keccak256, {
            sortPairs: true,
        });
        console.log('Merkle root:', tree.getRoot().toString('hex'));
        const proofs = getMerkleProof(tree, '0xf958A39588125ECf5AA6b297325321bD6dF411ab');
        console.log('proofs:', proofs);
        const soWhat = tree.verify(proofs, (0, ethers_1.keccak256)('0xf958A39588125ECf5AA6b297325321bD6dF411ab'), tree.getRoot().toString('hex'));
        console.log('soWhat:', soWhat);
    });
}
main();
// Transaction: 0x0c345b115c286227d170538897108bbbf18280c07eae4338a88f33fd9b88ed0c
// Contract created: 0x5fbdb2315678afecb367f032d93f642f64180aa3
// Gas used: 1230558
// Block Number: 1
// Block Hash: 0x6c6594da55d8333ecd6d6c28888ab725634bc9333ea5ccd7e01ff2631e36a85a
// Block Time: "Wed, 31 Jan 2024 10:48:07 +0000"
// 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
// 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
// https://sepolia.infura.io/v3/a16082c2ca6c4a0aaa65723d838a4d55
// Transaction: 0xc6e24dd24fd0028008a43f53792ff4c68188ce1aad4e4521f9d5dee2dbcb224a
// Gas used: 53788
// Block Number: 2
// Block Hash: 0x646e68f27ac63ac233d34335a10b834a953bfb2333eb417d9b163f5a7e7a06be
// Block Time: "Wed, 31 Jan 2024 10:54:07 +0000"
