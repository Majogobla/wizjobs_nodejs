const mogoose = require('mongoose');
mogoose.Promise = global.Promise;
const slug = require('slug');
const shortid = require('shortid');

const vacanteSchema = new mogoose.Schema(
    {
        titulo:
        {
            type: String,
            required: 'El nombre de la vacante es obligatorio',
            trim: true,
        },
        empresa:
        {
            type: String,
            trim: true,
        },
        ubicacion:
        {
            type: String,
            required: 'La ubicación es obligatoria',
            trim: true,
        },
        salario:
        {
            type: String,
            default: 0,
            trim: true,
        },
        contrato:
        {
            type: String,
            trim: true,
        },
        descripcion:
        {
            type: String,
            trim: true,
        },
        url:
        {
            type: String,
            lowercase: true,
        },
        skills: [String],
        candidatos:
        [
            {
                nombre: String,
                email: String,
                cv: String,
            }
        ],
        autor:
        {
            type: mogoose.Schema.ObjectId,
            ref: 'Usuarios',
            required: 'El usuario es obligatorio',
        }
    }
);

vacanteSchema.pre('save', function(next)
{
    // crear la url
    const url = slug(this.titulo);
    this.url = `${url}-${shortid.generate()}`;
    
    next();
});

// Crear un indice
vacanteSchema.index({titulo: 'text'});

module.exports = mogoose.model('Vacante', vacanteSchema);