const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, NotificationController.listar);
router.put('/:id/read', authenticateToken, NotificationController.marcarLeida);
router.put('/read-all', authenticateToken, NotificationController.marcarTodasLeidas);

module.exports = router;
