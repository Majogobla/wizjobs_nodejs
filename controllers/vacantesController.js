const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');
const multer = require('multer');
const shortid = require('shortid');

exports.formularioNuevaVacante = (req, res) =>
{
    res.render('nueva-vacante', 
    {
        nombrePagina: 'Nueva Vacante',
        tagline: 'Llena el formulario y publica tu vacante',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
    })
};

// Agrega las vacantes a la BD
exports.agregarVacante = async (req, res) =>
{
    const vacante = new Vacante(req.body);

    // Usuario autor de la vacante
    vacante.autor = req.user._id;

    // Crear arreglo de habilidades (skills)
    vacante.skills = req.body.skills.split(',');

    // Almacenarlo en la BD
    const nuevaVacante = await vacante.save();

    res.redirect(`/vacantes/${nuevaVacante.url}`);
}

// MUestra una vacante
exports.mostrarVacante = async (req, res, next) =>
{
    const vacante = await Vacante.findOne({url: req.params.url}).populate('autor').lean();

    // Si no hay resultados
    if(!vacante) return next();

    res.render('vacante', 
    {
        vacante,
        nombrePagina: vacante.titulo,
        barra: true,
    })
};

// Editar Vacante
exports.formEditarVacante = async (req, res, next) =>
{
    const vacante = await Vacante.findOne({url: req.params.url}).lean();

    if(!vacante) return next();

    res.render('editar-vacante',
    {
        vacante,
        nombrePagina: `Editar - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
    })
}

exports.editarVacante = async (req, res) =>
{
    const vacanteActualizada = req.body;

    vacanteActualizada.skills = req.body.skills.split(',');

    const vacante = await Vacante.findOneAndUpdate({url: req.params.url}, vacanteActualizada, {new: true, runValidators: true});

    res.redirect(`/vacantes/${vacante.url}`);
}

// Validar y sanitizar los campos de las vacantes
exports.validarVacante = (req, res, next) =>
{
    // Sanitizar los Campos
    req.sanitizeBody('titulo').escape();
    req.sanitizeBody('empresa').escape();
    req.sanitizeBody('ubicacion').escape();
    req.sanitizeBody('salario').escape();
    req.sanitizeBody('contrato').escape();
    req.sanitizeBody('skills').escape();

    //validar
    req.checkBody('titulo', 'La Vacante no pues ir Vacía').notEmpty();
    req.checkBody('empresa', 'Agrega una Empresa').notEmpty();
    req.checkBody('ubicacion', 'Agrega una ubicación').notEmpty();
    req.checkBody('contrato', 'Selecciona un tipo de contrato').notEmpty();
    req.checkBody('skills', 'Agrega al menos una habilidad').notEmpty();

    const errores = req.validationErrors();

    if(errores)
    {
        // Recarga la vista con los errores
        req.flash('error', errores.map(error => error.msg));

        return res.render('nueva-vacante', 
        {
            nombrePagina: 'Nueva Vacante',
            tagline: 'Llena el formulario y publica tu vacante',
            cerrarSesion: true,
            nombre: req.user.nombre,
            mensajes: req.flash(),
        })
    }

    // Siguiente middelware
    next();
}

// Eliminar Vacante
exports.eliminarVacante = async (req, res) =>
{
    const { id } = req.params;

    const vacante = await Vacante.findById(id);

    if(verificarAutor(vacante, req.user))
    {
        // Si es el usuari, Eliminar
        await Vacante.findOneAndDelete(id);
        res.status(200).send('Vacante Eliminada Correctamente');
    }
    else
    {
        // No permitido
        res.status(403).send('Error');
    }
}

const verificarAutor = (vacante = {}, usuario = {}) =>
{
    if(!vacante.autor.equals(usuario._id))
    {
        return false
    }

    return true;
}

// Subir archivos
exports.subirCV = (req, res, next) =>
{
    upload(req, res, function(error)
    {
        if(error)
        {
            if(error instanceof multer.MulterError) 
            {
                if(error.code === 'LIMIT_FILE_SIZE')
                {
                    req.flash('error', 'El Archivo es muy grande, máximo 100kb');
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

            res.redirect('back');
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
    limits: {fileSize: 100000},
    storage: fileStorage = multer.diskStorage(
        {
            destination: (req, fil, cb) => 
            {
                cb(null, __dirname+'../../public/uploads/cv');
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
        if(file.mimetype === 'application/pdf') 
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

const upload = multer(configuracionMulter).single('cv');

// Almacenar los candidatos en BD
exports.contactar = async (req, res, next) =>
{
    const vacante = await Vacante.findOne({url: req.params.url});

    // Si no existe la vacante
    if(!vacante) return next();

    // Construir el nuevo objeto
    const nuevoCandidato = 
    {
        nombre: req.body.nombre,
        email: req.body.email,
        cv: req.file.filename,
    }

    // Almacenar la vacante
    vacante.candidatos.push(nuevoCandidato);

    await vacante.save();

    // Mensaje flash y redireccion
    req.flash('correcto', 'Se envió tu CV correctamente');
    res.redirect('/');
}

exports.mostrarCandidatos = async (req, res, next) =>
{
    const vacante = await Vacante.findById(req.params.id).lean();

    if(!vacante) return next();
    if(vacante.autor != req.user._id.toString()) return next();

    res.render('candidatos',
    {
        nombrePagina: `Candidatos Vacante - ${vacante.titulo}`,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        candidatos: vacante.candidatos,
    })
};

// Buscador de Vacantes
exports.buscarVacantes = async (req, res) =>
{
    const vacantes = await Vacante.find(
        {
            $text:
            {
                $search: req.body.q,
            }
        }
    ).lean();

    // Mostrar las vacantes
    res.render('home',
    {
        nombrePagina: `Resultados para la búsqueda: ${req.body.q}`,
        barra: true,
        vacantes,
    })
};