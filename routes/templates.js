const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Template = require('../models/templates');

// Create template
router.post('/', auth, async (req, res) => {
    try {
        const { name, content, fields, category } = req.body;
        const template = new Template({
            name,
            content,
            fields,
            category,
            createdBy: req.user.id
        });

        await template.save();
        res.status(201).json(template);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all templates
router.get('/', auth, async (req, res) => {
    try {
        const templates = await Template.find({ isActive: true });
        res.json(templates);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get template by id
router.get('/:id', auth, async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.json(template);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Update template
router.put('/:id', auth, async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.json(template);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete template (soft delete)
router.delete('/:id', auth, async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        if (!template) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.json({ message: 'Template deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;