const express = require('express');
const homeController = require('../controllers/homeController.js');
const vacantesController = require('../controllers/vacantesController.js');
const usuariosController = require('../controllers/usuariosController.js');
const authController = require('../controllers/authController.js');

const router = express.Router();

module.exports = () =>
{
    router.get('/', homeController.mostrarTrabajos);

    // Crear vacantes
    router.get('/vacantes/nueva', authController.verificarUsuario, vacantesController.formularioNuevaVacante);
    router.post('/vacantes/nueva', authController.verificarUsuario, vacantesController.validarVacante, vacantesController.agregarVacante);

    // Mostrar vacante (singular)
    router.get('/vacantes/:url', vacantesController.mostrarVacante);

    // Editar vacante
    router.get('/vacantes/editar/:url', authController.verificarUsuario, vacantesController.formEditarVacante);
    router.post('/vacantes/editar/:url', authController.verificarUsuario, vacantesController.validarVacante, vacantesController.editarVacante);

    // Eliminar Vacantes
    router.delete('/vacantes/eliminar/:id', vacantesController.eliminarVacante);

    // Crear cuentas
    router.get('/crear-cuenta', usuariosController.formCrearCuenta);
    router.post('/crear-cuenta', usuariosController.validatRegistro, usuariosController.crearUsuario);

    // Autenticar usuarios
    router.get('/iniciar-sesion', usuariosController.formIniciarSesion);
    router.post('/iniciar-sesion', authController.autenticarUsuario);

    // Cerrar Sesion
    router.get('/cerrar-sesion', authController.verificarUsuario, authController.cerrarSesion);
    
    // Reestablecer contraseña
    router.get('/reestablecer-password', authController.formReestablecerPassword);
    router.post('/reestablecer-password', authController.enviarToken);

    // Reestablecer password (Almacenar en la base de datos)
    router.get('/reestablecer-password/:token', authController.reestablecerPassword);
    router.post('/reestablecer-password/:token', authController.guardarPassword);

    // Panel de administracion
    router.get('/administracion', authController.verificarUsuario, authController.mostrarPanel);

    // Editar perfil
    router.get('/editar-perfil', authController.verificarUsuario, usuariosController.formEditarPerfil);
    router.post('/editar-perfil', 
        authController.verificarUsuario, 
        // usuariosController.validarPerfil,
        usuariosController.subirImagen,
        usuariosController.editarPerfil
    );

    // Recibir mensajes de candidatos
    router.post('/vacantes/:url', vacantesController.subirCV, vacantesController.contactar);

    // Muestra los candidatos por vacante
    router.get('/candidatos/:id', authController.verificarUsuario, vacantesController.mostrarCandidatos);

    // Buscador de Vacantes
    router.post('/buscador', vacantesController.buscarVacantes)

    return router;
}