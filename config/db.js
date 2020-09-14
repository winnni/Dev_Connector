const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');
//mongoose.connect(db);
const connectDB = async () => {
    try {
        await mongoose.connect(db, {
            useNewUrlParser: true,
            useCreateIndex: true,
            useUnifiedTopology: true,
            useFindAndModify: false
        });
        console.log('La base de donnée est connecté');
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}
module.exports = connectDB;


















/* 
const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
    try {
        await mongoose.connect(db, {
            useUnifiedTopology: true,
            useNewUrlParser: true,
            useCreateIndex: true
        });
        console.log('la base mongoose est connecté...');
    } catch (error) {
        console.error(err.message);
        process.exit(1);
    }
}

module.exports = connectDB;
*/