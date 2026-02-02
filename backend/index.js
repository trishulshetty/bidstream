const express = require('express')
const app = express()
const cors = require('cors')
const dotenv=require('dotenv')
const authRoutes=require('./src/routes/auth')

dotenv.config();

//middlewares 
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT  || 5000 ;

app.use('/api/auth',authRoutes);


app.listen(5000,()=> { 
    console.log(`Server Running on ${PORT}`)
});
