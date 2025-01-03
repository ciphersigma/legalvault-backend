const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Document = require('../models/Documents.js');
const crypto = require('crypto');

// Create document
router.post('/', auth, async (req, res) => {
    try {
        const { title, templateId, content, signers } = req.body;
        
        // Generate document hash
        const documentHash = crypto
            .createHash('sha256')
            .update(JSON.stringify({ title, content, timestamp: Date.now() }))
            .digest('hex');

        const document = new Document({
            title,
            template: templateId,
            content,
            createdBy: req.user.id,
            signers: signers.map(signer => ({ user: signer })),
            documentHash
        });

        await document.save();
        res.status(201).json(document);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all documents
router.get('/', auth, async (req, res) => {
    try {
        const documents = await Document.find({
            $or: [
                { createdBy: req.user.id },
                { 'signers.user': req.user.id }
            ]
        })
        .populate('template', 'name')
        .populate('createdBy', 'username email')
        .populate('signers.user', 'username email')
        .sort({ createdAt: -1 });
        
        res.json(documents);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get document by id
router.get('/:id', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id)
            .populate('template')
            .populate('createdBy', 'username email')
            .populate('signers.user', 'username email');
            
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Verify document integrity
        const verificationHash = crypto
            .createHash('sha256')
            .update(JSON.stringify({ title: document.title, content: document.content, timestamp: document.createdAt }))
            .digest('hex');

        const isVerified = verificationHash === document.documentHash;
        
        res.json({
            ...document.toJSON(),
            verified: isVerified
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Sign document
router.post('/:id/sign', auth, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const signerIndex = document.signers.findIndex(
            signer => signer.user.toString() === req.user.id
        );

        if (signerIndex === -1) {
            return res.status(403).json({ message: 'Not authorized to sign this document' });
        }

        // Create signature hash
        const signatureHash = crypto
            .createHash('sha256')
            .update(JSON.stringify({
                documentId: document._id,
                signerId: req.user.id,
                timestamp: Date.now()
            }))
            .digest('hex');

        document.signers[signerIndex].status = 'signed';
        document.signers[signerIndex].signedAt = Date.now();
        document.signers[signerIndex].signatureHash = signatureHash;

        const allSigned = document.signers.every(signer => signer.status === 'signed');
        if (allSigned) {
            document.status = 'signed';
            document.completedAt = Date.now();
        }

        await document.save();
        res.json(document);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Share document
router.post('/:id/share', auth, async (req, res) => {
    try {
        const { userId } = req.body;
        const document = await Document.findById(req.params.id);
        
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        if (document.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to share this document' });
        }

        const alreadySigner = document.signers.some(
            signer => signer.user.toString() === userId
        );

        if (!alreadySigner) {
            document.signers.push({
                user: userId,
                addedAt: Date.now(),
                addedBy: req.user.id
            });
            await document.save();
        }

        res.json(document);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get pending documents
router.get('/pending/signatures', auth, async (req, res) => {
    try {
        const documents = await Document.find({
            'signers.user': req.user.id,
            'signers.status': 'pending',
            status: { $ne: 'signed' }
        })
        .populate('template', 'name')
        .populate('createdBy', 'username email');
        
        res.json(documents);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;