const mongoose = require("mongoose");
const Counter = require("./Counter");

// Define the Product Schema and Model
const ProductSchema = new mongoose.Schema({
    productId: {
        type: Number,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: true,
    },
    details: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        require: true
    },
    image: {
        type: Array,
        required: true,
    },
}, { timestamps: true });

const Product = mongoose.model('Product', ProductSchema);

// Function to get the next sequence value
async function getNextSequenceValue(sequenceName) {
    const sequenceDocument = await Counter.findByIdAndUpdate(
        sequenceName,
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
    );
    return sequenceDocument.sequence_value;
}

// Function to create a new product
async function createProduct(productData) {
    try {
        const nextProductId = await getNextSequenceValue('productId');
        const newProduct = new Product({
            productId: nextProductId,
            ...productData
        });

        await newProduct.save();
        return newProduct;
    } catch (error) {
        console.error('Error creating product:', error);
        throw error;
    }
}

// Export the models and functions
module.exports = {
    Product,
    createProduct
};