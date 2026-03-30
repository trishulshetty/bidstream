const express = require('express');
const router = express.Router();
const simulatorController = require('../controllers/simulatorController');

router.post('/run', simulatorController.runSimulation);

module.exports = router;
