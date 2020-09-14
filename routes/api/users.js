const express = require('express');
const router = express.Router();
const {
    check,
    validationResult
} = require('express-validator');
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

//@route        api/profile
//@desc         test de la route
//@access       public

router.post('/', [
    check('name', 'name is required').not().isEmpty(),
    check('email', 'email is required').isEmail(),
    check('password', 'le minimum de caratère est de 6').isLength({
        min: 6
    })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(404).json({
            errors: errors.array()
        });
    }
    const {
        name,
        email,
        password
    } = req.body;
    try {
        //See if user exist
        let user = await User.findOne({
            email
        });
        if (user) {
            return res.status(400).json({
                errors: [{
                    msg: 'User existe déjà'
                }]
            });
        }

        //Obtenir le gravatar de l'utilisateur
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        });

        user = new User({
            name,
            email,
            avatar,
            password
        });

        //Encrypter le mot de passe
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        //return jsonwebtoken
        const payload = {
            user: {
                id: user.id
            }
        }
        jwt.sign(payload,
            config.get('jwtSecret'), {
                expiresIn: 360000
            },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token
                });
            }
        );
    } catch (error) {
        console.error(err.message);
        res.status(500).json('Server Error');
    }
});

module.exports = router;



















/*
const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const {
    check,
    validationResult
} = require('express-validator');

//@route            POST api/users
//@desc             Register la route
//@access           Public
router.post('/', [
        check('name', 'Le nom est requis').not().isEmpty(),
        check('email', 'Svpl entrer un email correct').isEmail(),
        check('password', 'Svpl que le mot de passe soit au moins 6 alphabets').isLength({
            min: 6
        })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }
        const {
            name,
            email,
            password
        } = req.body;
        try {
            // voir si l'utilisateur existe
            let user = await User.findOne({
                email
            });

            if (user) {
                return res.status(400).json({
                    errors: [{
                        msg: 'L\'utilisateurs existe déjà'
                    }]
                });
            }
            // obtenir le gravatar de l'utilisateur
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            })
            //creation d'une instance de user
            user = new User({
                name,
                email,
                avatar,
                password
            })
            // Crypter le mot de passe
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);

            await user.save();
            // Retourner le jsonwebtoken
            const payload = {
                user: {
                    id: user.id
                }
            }


            jwt.sign(payload, config.get('jwtSecret'), {
                expiresIn: 360000
            }, (err, token) => {
                if (err) throw err;
                res.json({
                    token
                });
            });
            //res.send('Enregistrement utilisateur');
        } catch (err) {
            console.log(err.message);
            res.status(500).send('Server error');
        }

    });

module.exports = router;
*/