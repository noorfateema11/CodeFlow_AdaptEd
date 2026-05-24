const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log("Trying to reach MongoDB Atlas...");
        const connection = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 4000 
        });
        console.log(`GLORIOUS SUCCESS: Connected to database host: ${connection.connection.host}`);
    } catch (error) {
        console.error(`HARD CRASH: Database Connection Failed! Reason: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;