import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import connectDB from './config/db.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Connect to database
connectDB()

// Middleware
app.use(cors())
app.use(express.json())

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'CampusRide API is running' })
})

// Start server
app.listen(PORT, 'localhost', () => {
  console.log(`Server running on port ${PORT}`)
})