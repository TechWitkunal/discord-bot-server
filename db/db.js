require('dotenv').config();

const mongoose = require('mongoose');

const connectToMongoose = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL, {
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
            socketTimeoutMS: 45000,         // Socket timeout after 45 seconds
        });
        console.log('Connected to MongoDB..................');
    } catch (error) {
        console.error("DB connection failed with error -> ", error);
    }
}

module.exports = connectToMongoose;

// password - kunal1287
// mongodb+srv://kunalagrawal1818:kunal1287@cluster0.wnlry.mongodb.net
// username - kunalagrawal1818