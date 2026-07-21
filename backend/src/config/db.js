import mongoose from 'mongoose';
import dns from 'node:dns'; // 🚀 PRODUCTION SAFEGUARD: Native Node DNS engine

// Force Node to use reliable public DNS resolvers to bypass local ISP / router SRV lookup bugs
dns.setServers(['8.8.8.8', '8.8.4.4']); 

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;