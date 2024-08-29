const express = require('express');
const { userProduct } = require('../controllers/Product');
const router = express.Router();

router.get('/user-product', userProduct);


module.exports = router; // Export the router
