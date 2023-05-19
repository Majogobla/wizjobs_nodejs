const passport = require('passport');
const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');
const Usuarios = mongoose.model('Usuarios');
const crypto = require('crypto');
const enviarEmail = require('../handlers/email.js');

exports.autenticarUsuario = passport.authenticate('local',
{
    successRedirect: '/administracion',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos campos son obligatorios',
});

// Revisar si el usuario esta autenticado o no
exports.verificarUsuario = (req, res, next) =>
{
    // revisar el usuario
    if(req.isAuthenticated())
    {
        // Estan autenticados
        return next(); 
    }

    res.redirect('/iniciar-sesion');
}

exports.mostrarPanel = async (req, res) =>
{
    // Consultar el usuario autenticado
    const vacantes = await Vacante.find({autor: req.user._id}).lean();

    res.render('administracion', 
    {
        nombrePagina: 'Panel de Administración',
        tagline: 'Crea y Administra tus vacantes desde aquí',
        vacantes,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
    })
};

exports.cerrarSesion = (req, res, next) =>
{
    req.logout(function(error)
    {
        if(error)
        {
            return next(error);
        }

        return next();
    });

    req.flash('correcto', 'Cerraste Sesión Correctamente');

    return res.redirect('/iniciar-sesion');
}

// Formulario para reinicar el password
exports.formReestablecerPassword = (req, res) =>
{
    res.render('reestablecer-password',
    {
        nombrePagina: 'Reestablece tu Contraseña',
        tagline: 'Si ya tienes cuenta pero olvidaste tu password, coloca tu correo',
    })
}

// Genera el token en la tabla de usuario
exports.enviarToken = async (req, res) =>
{
    const usuario = await Usuarios.findOne({email: req.body.email});

    if(!usuario) 
    {
        req.flash('error', 'Esa Cuenta no Existe');
        return res.redirect('/iniciar-sesion');
    }

    // El usuario existe, generar token
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expira = Date.now() + 3600000;

    // Guardar el usuario
    await usuario.save();
    const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`;

    // Enviar notificacion por email
    await enviarEmail.enviar(
        {
            usuario,
            subject: 'Reestablecer Contraseña',
            resetUrl,
            archivo: 'reset',
        }
    )

    // Todo correcto
    req.flash('correcto', 'Revisa tu correo para las indicaciones');
    res.redirect('/iniciar-sesion');
}

// Valida si el token es válido y el usuario existe, muestra la vista
exports.reestablecerPassword = async (req, res) =>
{
    const usuario = await Usuarios.findOne(
    {
        token: req.params.token,
        expira: 
        {
            $gt: Date.now(),
        }
    });

    if(!usuario)
    {
        req.flash('error', 'El formulario ya no es válido, intenta de nuevo');
        return res.redirect('/reestablecer-password');
    }

    // Todo bien, mostrar el formulario
    res.render('nuevo-password',
    {
        nombrePagina: 'Nueva Contraseña'
    });
}

// Almacena el nuevo password en la BD
exports.guardarPassword = async (req, res) =>
{
    const usuario = await Usuarios.findOne(
    {
        token: req.params.token,
        expira: 
        {
            $gt: Date.now(),
        }
    });

    // No existe el usuario o el token es inválido
    if(!usuario)
    {
        req.flash('error', 'El formulario ya no es válido, intenta de nuevo');
        return res.redirect('/reestablecer-password');
    }

    // Asigna el nuevo password, limpia valores previos
    usuario.password = req.body.password;
    usuario.token = undefined;
    usuario.expira = undefined;

    // Guardar en la BD
    await usuario.save();

    // Redirigir
    req.flash('correcto', 'Contraseña Modificada Correctamente');
    res.redirect('/iniciar-sesion');
}
