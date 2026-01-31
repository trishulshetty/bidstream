require('dotenv').config();
const app = require('./src/app')

const PORT = process.env.PORT || 5000 ; 

const startServer =async () => {

    app.listen(PORT , () => {
        console.log(`Server listening on PORT ${PORT}`);
    });

};

startServer();


 