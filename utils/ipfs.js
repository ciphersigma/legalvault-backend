const { create } = require('ipfs-http-client');
const crypto = require('crypto');

// Connect to local IPFS node
const ipfs = create('http://localhost:5001');

const generateHash = (data) => {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

const uploadToIPFS = async (data) => {
    try {
        const content = Buffer.from(JSON.stringify(data));
        const result = await ipfs.add(content);
        return {
            success: true,
            hash: result.path,
            size: result.size
        };
    } catch (error) {
        console.error('IPFS upload error:', error);
        throw error;
    }
};

const getFromIPFS = async (hash) => {
    try {
        const stream = ipfs.cat(hash);
        let data = '';
        
        for await (const chunk of stream) {
            data += chunk.toString();
        }
        
        return {
            success: true,
            data: JSON.parse(data)
        };
    } catch (error) {
        console.error('IPFS retrieval error:', error);
        throw error;
    }
};

const pinDocument = async (hash) => {
    try {
        await ipfs.pin.add(hash);
        return {
            success: true,
            message: 'Document pinned successfully'
        };
    } catch (error) {
        console.error('IPFS pinning error:', error);
        throw error;
    }
};

module.exports = {
    generateHash,
    uploadToIPFS,
    getFromIPFS,
    pinDocument
};