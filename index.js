const mongoose = require('mongoose');
require('./config/db.js');

const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path')
const router = require('./routes');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const createError = require('http-errors');
const passport = require('./config/passport.js');

require('dotenv').config({path: 'variables.env'});

const app = express();

// Habilitar bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Validación de canpos
app.use(expressValidator());

// Habilitar handlebars como template engine
app.engine('handlebars', 
    exphbs.engine(
        {
            defaultLayout: 'layout',
            helpers: require('./helpers/handlebars'),
        }
    )
);

app.set('view engine', 'handlebars');

// Static
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());

app.use(session(
    {
        secret: process.env.SECRETO,
        key: process.env.KEY,
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({mongoUrl: process.env.DATABASE}),
    }
));

// Inicializar passport
app.use(passport.initialize());
app.use(passport.session());

// Alertas y flash messages
app.use(flash());

// Crear nuestro middleware
app.use((req, res, next) =>
    {
        res.locals.mensajes = req.flash();
        next();
    }
)

app.use('/', router());

// 404 página no existente
app.use((req, res, next) => 
{
    next(createError(404, 'No encontrado'));
});

// Administracion de los errores
app.use((error, req, res) =>
{
    res.locals.mensaje = error.message;

    const status = error.status || 500;
    res.locals.status = status;
    
    res.status(status);
    res.render('error');
});

// Dejar que Heroku asigne el puerto
const host = '0.0.0.0';
const port = process.env.PORT || 5000;

app.listen(port, host, () =>
{
    console.log('El servidor está funcionando');
});