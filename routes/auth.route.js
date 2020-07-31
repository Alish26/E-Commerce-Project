const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require('express-validator');
const gravatar = require('gravatar');
const User = require('../models/User');
const { model } = require('mongoose');
const auth = require('../middleware/auth');

router.post('/', auth, (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

router.post('/register',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({
            min: 6
        })
    ], 
    async (req, res) => {
         const errors = validationResult(req);
         if(!errors.isEmpty()){
             return res.status(400).json({
                 errors: errors.array()
             });
         }

         const {name, email, password} = req.body;
         try {
             let user = await User.findOne({email});
             if(user){
                 return res.status(400).json({
                     errors: [
                         {
                            msg: 'User already exists'
                         },
                     ]
                 });
             }

             const avatar = gravatar.url(email, {
                 s: '200',
                 r: 'pg',
                 d: 'mm'
             })

             user = new User({
                 name, email, avatar, password
             });

             const salt = await bcrypt.genSalt(10);
             user.password = await bcrypt.hash(password, salt);
             await user.save();
             const payload = {
                 user: {
                     id: user.id,
                 }
             }
             jwt.sign(
                 payload,
                 process.env.JWT_SECRET, {
                     expiresIn: 360000
                 }, (err, token) => {
                     if(err) throw err
                     res.json({ token });
                 }
             );

         } catch (error) {
             console.log(err.message);
             res.status(500).send('Server error');
         }
    }
);

router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password a required' ).exists()
], async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({
            errors: errors.array(),
        });
    }

    const { email, password } = req.body;

    try {
        let user = await User.findOne({
            email
        });

        if(!user){
            return res.status(400).json({
                errors: [
                    { msg: 'Invalid credentials' }
                ]
            });
        }

        const isMatch = bcrypt.compare(password, user.password);
        if(!isMatch){
            return res.status(400).json({
                errors: [
                    { msg: 'Invalid credentials' }
                ]
            });
        }

        const payload = { user: {id: user.id } }

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000}, (err, token) => {
            if(err) throw err;
            res.json({
                token
            });
        })
    } catch (error) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router