const ethers = require('ethers');
const crypto = require('crypto');

// Contract ABI and address - Replace with your deployed contract details
const contractABI = [
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "documentHash",
                "type": "string"
            }
        ],
        "name": "addDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "documentHash",
                "type": "string"
            }
        ],
        "name": "verifyDocument",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];
const contractAddress = "YOUR_CONTRACT_ADDRESS";

// Connect to Ethereum network (example using local network)
const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
const signer = provider.getSigner();
const contract = new ethers.Contract(contractAddress, contractABI, signer);

const generateDocumentHash = (document) => {
    return crypto
        .createHash('sha256')
        .update(JSON.stringify(document))
        .digest('hex');
};

const addDocumentToBlockchain = async (documentData) => {
    try {
        const documentHash = generateDocumentHash(documentData);
        const tx = await contract.addDocument(documentHash);
        await tx.wait();
        return {
            success: true,
            hash: documentHash,
            transactionHash: tx.hash
        };
    } catch (error) {
        console.error('Blockchain error:', error);
        throw error;
    }
};

const verifyDocumentOnBlockchain = async (documentData) => {
    try {
        const documentHash = generateDocumentHash(documentData);
        const isVerified = await contract.verifyDocument(documentHash);
        return {
            isVerified,
            documentHash
        };
    } catch (error) {
        console.error('Verification error:', error);
        throw error;
    }
};

module.exports = {
    generateDocumentHash,
    addDocumentToBlockchain,
    verifyDocumentOnBlockchain
};