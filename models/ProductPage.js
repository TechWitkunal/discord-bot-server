const mongoose = require("mongoose");

// Define the Product Schema and Model
const ProductPages = new mongoose.Schema({
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    username: {
        type: String,
        required: true,
    },
    pageTitle: {
        type: String,
    },
    product: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    }],
}, { timestamps: true });

const ProductPage = new mongoose.model("ProductPage", ProductPages);
module.exports = ProductPage;