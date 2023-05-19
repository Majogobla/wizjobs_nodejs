const mongoose = require('mongoose');
const Usuarios = mongoose.model('Usuarios');
const multer = require('multer');
const shortid = require('shortid');

exports.subirImagen = (req, res, next) =>
{
    upload(req, res, function(error)
    {
        if(error)
        {
            if(error instanceof multer.MulterError) 
            {
                if(error.code === 'LIMIT_FILE_SIZE')
                {
                    req.flash('error', 'El Archivo es muy grande, máximo 1mb');
                }
                else
                {
                    req.flash('error', error.message);
                }
            }
            else 
            {
                req.flash('error', error.message);
            }

            res.redirect('/administracion');
        } 
        else 
        {
            return next();
        }
    });
}

// Opciones de Multer
const configuracionMulter =
{
    limits: {fileSize: 1000000},
    storage: fileStorage = multer.diskStorage({
            destination: (req, fil, cb) => 
            {
                cb(null, __dirname+'../../public/uploads/perfiles');
            },
            filename: (req, file, cb) => 
            {
                const extension = file.mimetype.split('/')[1];
                
                cb(null, `${shortid.generate()}.${extension}`);
            }
        }
    ),
    fileFilter(req, file, cb)
    {
        if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg' ) 
        {
            // El CB se ejeecuta como true o false: true cuando la imagen se acepta
            cb(null, true);
        } 
        else 
        {
            cb(new Error('Formato No Válido'), false);
        }
    },
}

const upload = multer(configuracionMulter).single('imagen');

exports.formCrearCuenta = (req, res) =>
{
    res.render('crear-cuenta',
    {
        nombrePagina: 'Crea tu Cuenta en WizJobs',
        tagline: 'Comienza a publicar tus vacantes gratis, solo debes de crear una cuenta'
    })
}

exports.validatRegistro = (req, res, next) =>
{
    // Sanitizar
    req.sanitizeBody('nombre').escape();
    req.sanitizeBody('email').escape();
    req.sanitizeBody('password').escape();
    req.sanitizeBody('confirmar').escape();

    // Validar
    req.checkBody('nombre', 'El Nombre es Obligatorio').notEmpty();
    req.checkBody('email', 'El Correo no es Válido').isEmail();
    req.checkBody('password', 'La Contraseña es Obligatorio').notEmpty();
    req.checkBody('confirmar', 'Repetir la Contraseña es Obligatorio').notEmpty();
    req.checkBody('confirmar', 'Las Contraseñas no Coinciden').equals(req.body.password);

    const errores = req.validationErrors();

    if(errores)
    {
        // Si  hay errores
        req.flash('error', errores.map(error => error.msg));

        res.render('crear-cuenta',
        {
            nombrePagina: 'Crea tu Cuenta en WizJobs',
            tagline: 'Comienza a publicar tus vacantes gratis, solo debes de crear una cuenta',
            mensajes: req.flash(),
        });

        return;
    }

    // Si toda la validación es correcta
    next();
}

exports.crearUsuario = async (req, res, next) =>
{
    // Crear usuario
    const usuario = new Usuarios(req.body);

    try 
    {
        await usuario.save();
        res.redirect('/iniciar-sesion');
    } 
    catch (error) 
    {
        req.flash('error', error);
        res.redirect('/crear-cuenta');
    }
}

// Formulario para iniciar sesion
exports.formIniciarSesion = (req, res) =>
{
    res.render('iniciar-sesion',
    {
        nombrePagina: 'Iniciar Sesión WizJobs',
    })
}

// Form editar perfil
exports.formEditarPerfil = (req, res) =>
{
    // console.log(req.user);

    res.render('editar-perfil', 
    {
        nombrePagina: 'Edita tu Perfil en WizJobs',
        nombre: req.user.nombre,
        email: req.user.email,
        imagen: req.user.imagen,
        cerrarSesion: true,
    });
}

// Guardar cambios editar perfil
exports.editarPerfil = async (req, res) =>
{
    const usuario = await Usuarios.findById(req.user._id);

    usuario.nombre = req.body.nombre;
    usuario.email = req.body.email;
    if(req.body.password)
    {
        usuario.password = req.body.password;
    }

    if(req.file)
    {
        usuario.imagen = req.file.filename;
    }

    await usuario.save();

    req.flash('correcto', 'Cambios Guardados Correctamente');

    // Redirect
    res.redirect('/administracion');
}

// Sanitizar y validar formulario de editar perfiles
exports.validarPerfil = (req, res, next) =>
{
    req.sanitizeBody('nombre').escape();
    req.sanitizeBody('email').escape();

    if(req.body.password)
    {
        req.sanitizeBody('password').escape();
    }

    // Validar
    req.checkBody('nombre', 'El Nombre es Obligatorio').notEmpty();
    req.checkBody('email', 'El Correo es Obligatorio').notEmpty();
    req.checkBody('password', 'El Contraseña es Obligatoria').notEmpty();

    const errores = req.validationErrors();

    if(errores)
    {
        req.flash('error', errores.map(error => error.msg));

        return res.render('editar-perfil', 
        {
            nombrePagina: 'Edita tu Perfil en WizJobs',
            nombre: req.user.nombre,
            email: req.user.email,
            cerrarSesion: true,
            mensajes: req.flash(),
            imagen: req.user.imagen,
        });
    }

    // Todo bien
    next();
}