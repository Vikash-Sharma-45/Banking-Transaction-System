

const app = require ('./src/app');

const connectToDB = require('./src/config/db.js')

connectToDB();

app.listen(3000, () => {
    console.log("Server is running on the port 300")
})