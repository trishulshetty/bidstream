const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');

// Force the app to use Google DNS to resolve Atlas SRV records
// This fixes the 'querySrv EREFUSED' error common on some networks
try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    console.log('🌐 DNS: Using Google DNS for SRV resolution');
} catch (e) {
    console.warn('⚠️ DNS: Could not set custom name servers, using system defaults');
}

dotenv.config();

const connectDB = async () => {
    try {
        console.log('📡 Attempting to connect to MongoDB Atlas...');

        // Settings for more resilient connection
        const options = {
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
        };

        const conn = await mongoose.connect(process.env.MONGO_URI, options);
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        if (error.message.includes('querySrv EREFUSED')) {
            console.error('❌ DNS Error: Your network is blocking MongoDB SRV records.');
            console.log('👉 Tip: I have tried to override DNS, but you might need to use a different internet connection (like a hotspot).');
        } else {
            console.error(`❌ MongoDB Connection Error: ${error.message}`);
        }
        console.log('⚠️  The server will remain active, but database features (Auth/Lobby) will fail until the connection is fixed.');

        // Masked URI for debugging
        const maskedUri = process.env.MONGO_URI ? process.env.MONGO_URI.replace(/:([^@]+)@/, ':****@') : 'undefined';
        console.log(`🔗 Target: ${maskedUri}`);
    }
};

module.exports = connectDB;
