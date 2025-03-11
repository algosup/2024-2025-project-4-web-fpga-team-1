const express = require('express');
const path = require('path');
const hbs = require('express-handlebars');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

// Middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

app.use((req, res, next) => {
    res.locals.username = req.session.username;
    res.locals.userId = req.session.userId;
    next();
});

// Middleware to disable caching for protected routes
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});

const route = require('./routes/routes');

app.use('/', route);

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '../frontend'));

app.engine('hbs', hbs.engine({
    extname: '.hbs',
    defaultLayout: false,
    partialsDir: path.join(__dirname, '../frontend/partials'), // Update this path
    runtimeOptions: {
        allowProtoPropertiesByDefault: true,
        allowProtoMethodsByDefault: true
    }
}));

app.listen(80, () => {
    console.log('Server is running on port 80');
});