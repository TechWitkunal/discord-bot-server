require('dotenv').config();

const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { isValidString } = require('../utils/main');
const ProductPage = require('../models/ProductPage'); // Ensure you import your model

exports.userProduct = async (req, res) => {
    try {
        const { slug } = req.query;
        console.log('Received slug:', slug);

        if (!isValidString(slug)) {
            throw new ApiError(401, "Slug is not provided");
        }

        const userPage = await ProductPage.findOne({ slug: slug }); // Use findOne for a single document
        if (!userPage) {
            throw new ApiError(404, "Page Not Found");
        }

        const productPageWithDetails = await ProductPage.aggregate([
            {
                $match: { slug: slug } // Use the dynamic slug
            },
            {
                $lookup: {
                    from: "products", // The name of the collection that contains the product documents
                    localField: "product", // The field in ProductPage that contains product IDs
                    foreignField: "_id", // The field in the products collection to match
                    as: "productDetails" // The name of the field in the output that will contain the joined documents
                }
            },
            {
                $project: {
                    slug: 1,
                    username: 1,
                    pageTitle: 1,
                    productDetails: 1, // Include the full product documents instead of the product IDs
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

        // console.log(JSON.stringify(productPageWithDetails, null, 2));

        // Return a success response with the product details
        return res.json({ success: true, statusCode: 200, message: "Page found", data: productPageWithDetails });

    } catch (error) {
        const errorMessage = error.message || "Internal Server Error";
        return res.json({ success: false, statusCode: error.statusCode || 500, message: errorMessage, error: undefined });
    }
}
