const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
    //obtenir le token du header
    const token = req.header('x-auth-token');
    // verifier si ça existe
    if (!token) {
        return res.status(400).json({
            msg: 'No token, authorisation refusé'
        });
    }
    try {
        //checker le token( decoder, signer)
        const decode = jwt.verify(token, config.get('jwtSecret'));
        req.user = decode.user;
        next();
    } catch (error) {
        res.status(401).json({
            msg: 'Token pas valide'
        });
    }

}
















/*
const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
    // appeler le header en tête
    const token = req.header('x-auth-token');

    // checker l'existence du token
    if (!token) {
        return res.status(401).json({
            msg: 'Autorisation refusée token n\'existe pas'
        });
    }
    //verification decoder et assigner le token a un utilisateur
    try {
        const decode = jwt.verify(token, config.get('jwtSecret'));
        req.user = decode.user;
        next();
    } catch (err) {
        res.status(401).json({
            msg: 'Token n\'est pas valide'
        });
    }
}
*/