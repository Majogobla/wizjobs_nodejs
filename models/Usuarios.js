const mogoose = require('mongoose');
mogoose.Promise = global.Promise;
const bcrypt = require('bcrypt');

const usuariosSchema = new mogoose.Schema(
    {
        email:
        {
            type: String,
            unique: true,
            lowercase: true,
            trim: true,
        },
        nombre:
        {
            type: String,
            required: true,
        },
        password:
        {
            type: String,
            required: true,
            trim: true,
        },
        token: String,
        expira: Date,
        imagen: String,
    }
);

// Método para hashear las contraseñas
usuariosSchema.pre('save', async function(next)
{
    // Si el password ya esta hasheado
    if(!this.isModified('password'))
    {
        return next();
    }

    // Si no está hasheado
    const hash = await bcrypt.hash(this.password, 12);
    this.password = hash;
    next();
});

// Envia alerta cuando un usuario ya esta registrado
usuariosSchema.post('save', function(error, doc, next)
{
    if(error.name === 'MongoServerError' && error.code === 11000)
    {
        next('Ese correo ya está registrado');
    }
    else
    {
        next(error);
    }
});

// Autenticar usuarios
usuariosSchema.methods =
{
    compararPassword: function(password)
    {
        return bcrypt.compareSync(password, this.password);
    }
};

module.exports = mogoose.model('Usuarios', usuariosSchema);