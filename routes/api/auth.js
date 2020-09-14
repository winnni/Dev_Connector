const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

//@route        Get api/auth
//@desc         test auth
//@access       public

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json('Server error');
  }
});

//@route        Post api/auth
//@desc         authentification route
//@access       public
router.post(
  '/',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }

    const { email, password } = req.body;

    try {
      let user = await User.findOne({
        email,
      });

      if (!user) {
        return res.status(400).json({
          errors: [
            {
              msg: 'Invalid Credentials',
            },
          ],
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(400).json({
          errors: [
            {
              msg: 'Invalid Credentials',
            },
          ],
        });
      }

      const payload = {
        user: {
          id: user.id,
        },
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        {
          expiresIn: 360000,
        },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
          });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);
module.exports = router;

/*
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const auth = require('../../middleware/auth');
const User = require('../../models/User')
const jwt = require('jsonwebtoken');
const config = require('config');
const {
    check,
    validationResult
} = require('express-validator');


//@route            GET auth/route
//@desc             Tester la route
//@access           Public
router.get('/', auth, async (req, res) => {
    // retourner les info de l'utilisateur excepté le mot de passe
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur du Serveur');
    }
});

//@route            POST api/auth
//@desc             Authentification user
//@access           Public
router.post('/', [
        check('email', 'Svpl entrer un email correct').isEmail(),
        check('password', 'Le mot de passe est requis').exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }
        const {
            email,
            password
        } = req.body;
        try {
            // voir si l'utilisateur existe
            let user = await User.findOne({
                email
            });

            if (!user) {
                return res.status(400).json({
                    errors: [{
                        msg: 'Identifiant incorrect'
                    }]
                });
            }

            //verifier la corcondence entre les identifiant

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({
                    errors: [{
                        msg: 'Identifiant incorrect'
                    }]
                });
            }

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
