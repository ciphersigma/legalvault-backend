const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    template: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
        required: true
    },
    content: {
        type: Object,
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'signed', 'rejected'],
        default: 'draft'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    signers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'signed', 'rejected'],
            default: 'pending'
        },
        signedAt: Date,
        notes: String
    }],
    ipfsHash: String,
    blockchainTxHash: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Document', DocumentSchema);