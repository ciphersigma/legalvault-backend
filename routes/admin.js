const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const User = require('../models/user');
const Document = require('../models/Documents');
const Template = require('../models/templates');
const ActivityLog = require('../models/activityLog');

// Get dashboard statistics with added user activity metrics
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const [
            totalUsers,
            totalDocuments,
            totalTemplates,
            signedDocuments,
            pendingDocuments,
            recentActivities
        ] = await Promise.all([
            User.countDocuments(),
            Document.countDocuments(),
            Template.countDocuments(),
            Document.countDocuments({ status: 'signed' }),
            Document.countDocuments({ status: 'pending' }),
            ActivityLog.find()
                .sort({ timestamp: -1 })
                .limit(5)
                .populate('userId', 'username email')
        ]);

        res.json({
            success: true,
            data: {
                totalUsers,
                totalDocuments,
                totalTemplates,
                signedDocuments,
                pendingDocuments,
                recentActivities
            }
        });
    } catch (err) {
        console.error('Stats Error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: err.message
        });
    }
});

// Get all users with pagination and enhanced user details
router.get('/users', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        // Get activity counts for each user
        const usersWithActivity = await Promise.all(users.map(async (user) => {
            const [documentCount, activityCount] = await Promise.all([
                Document.countDocuments({ createdBy: user._id }),
                ActivityLog.countDocuments({ userId: user._id })
            ]);
            return {
                ...user.toObject(),
                documentCount,
                activityCount
            };
        }));

        const total = await User.countDocuments();

        res.json({
            success: true,
            data: usersWithActivity,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        console.error('Users Error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: err.message
        });
    }
});

// Enhanced user activity tracking
router.get('/users/:userId/activity', adminAuth, async (req, res) => {
    try {
        const [documents, activities] = await Promise.all([
            Document.find({
                $or: [
                    { createdBy: req.params.userId },
                    { 'signers.user': req.params.userId }
                ]
            })
            .sort({ createdAt: -1 })
            .populate('template', 'name')
            .populate('signers.user', 'username email'),
            
            ActivityLog.find({ userId: req.params.userId })
            .sort({ timestamp: -1 })
            .limit(50)
        ]);

        res.json({
            success: true,
            data: {
                documents,
                activities
            }
        });
    } catch (err) {
        console.error('Activity Error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching user activity',
            error: err.message
        });
    }
});

// Updated role management with activity logging
router.patch('/users/:userId/role', adminAuth, async (req, res) => {
    try {
        if (!req.body.role) {
            return res.status(400).json({
                success: false,
                message: 'Role is required'
            });
        }

        if (!['admin', 'user'].includes(req.body.role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role specified'
            });
        }

        const user = await User.findByIdAndUpdate(
            req.params.userId,
            { role: req.body.role },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Log role change activity
        await new ActivityLog({
            userId: req.user._id,
            targetUserId: req.params.userId,
            action: 'ROLE_UPDATE',
            details: `Updated user role to ${req.body.role}`,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
        }).save();

        res.json({
            success: true,
            data: user
        });
    } catch (err) {
        console.error('Role Update Error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Error updating user role',
            error: err.message
        });
    }
});

// Enhanced audit logs with activity tracking
router.get('/audit-logs', adminAuth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        let query = {};
        if (req.query.status) {
            query.status = req.query.status;
        }
        if (req.query.startDate && req.query.endDate) {
            query.timestamp = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        }

        const [documents, activities] = await Promise.all([
            Document.find(query)
                .populate('createdBy', 'username')
                .populate('signers.user', 'username')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit),
            
            ActivityLog.find(query)
                .populate('userId', 'username')
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
        ]);

        const total = await Document.countDocuments(query);
        const totalActivities = await ActivityLog.countDocuments(query);

        const auditLogs = {
            documents: documents.map(doc => ({
                action: doc.status,
                document: doc.title,
                user: doc.createdBy?.username || 'Unknown',
                timestamp: doc.updatedAt,
                signers: doc.signers.map(signer => ({
                    username: signer.user?.username,
                    status: signer.status,
                    signedAt: signer.signedAt
                }))
            })),
            activities: activities
        };

        res.json({
            success: true,
            data: auditLogs,
            pagination: {
                total: total + totalActivities,
                page,
                pages: Math.ceil((total + totalActivities) / limit)
            }
        });
    } catch (err) {
        console.error('Audit Logs Error:', err.message);
        res.status(500).json({
            success: false,
            message: 'Error fetching audit logs',
            error: err.message
        });
    }
});

module.exports = router;