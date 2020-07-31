const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
require('dotenv').config({
    path: './config/index.env',
});

const connectDB = require('./config/db');
connectDB();

app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(cors());

app.use('api/user/', require('./routes/auth.route'));

app.get('/', (req, res) => {
    res.send('test route => homepage');
});

app.use((req, res) => {
    res.status(404).json({
        msg: 'Page Not Found'
    })
});

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
});