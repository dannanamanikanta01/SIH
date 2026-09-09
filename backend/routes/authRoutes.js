const express = require('express');
const { login, listUsers, getStats, createUser, updateUser } = require('../controllers/authController');
const { requireAuth, allowRoles } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.get('/admin/users', requireAuth, allowRoles('admin'), listUsers);
router.get('/admin/stats', requireAuth, allowRoles('admin'), getStats);
router.post('/admin/users', requireAuth, allowRoles('admin'), createUser);
router.patch('/admin/users/:id', requireAuth, allowRoles('admin'), updateUser);

module.exports = router;