const express = require('express');
const router = express.Router();
const request = require('request');
const config = require('config');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const normalize = require('normalize-url');
const { check, validationResult } = require('express-validator');
const Post = require('../../models/Post');

// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id,
    });

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    // only populate from user document if profile exists
    res.json(profile.populate('user', ['name', 'avatar']));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      location,
      website,
      bio,
      skills,
      status,
      githubusername,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook,
    } = req.body;

    const profileFields = {
      user: req.user.id,
      company,
      location,
      website: website === '' ? '' : normalize(website, { forceHttps: true }),
      bio,
      skills: Array.isArray(skills)
        ? skills
        : skills.split(',').map((skill) => ' ' + skill.trim()),
      status,
      githubusername,
    };

    // Build social object and add to profileFields
    const socialfields = { youtube, twitter, instagram, linkedin, facebook };

    for (const [key, value] of Object.entries(socialfields)) {
      if (value && value.length > 0)
        socialfields[key] = normalize(value, { forceHttps: true });
    }
    profileFields.social = socialfields;

    try {
      // Using upsert option (creates new doc if no match is found):
      let profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true }
      );
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    GET api/profile
// @desc     Get all profiles
// @access   Public
router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id,
    }).populate('user', ['name', 'avatar']);

    if (!profile) return res.status(400).json({ msg: 'Profile not found' });

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    if (err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/profile
// @desc     Delete profile, user & posts
// @access   Private
router.delete('/', auth, async (req, res) => {
  try {
    // Remove user posts
    await Post.deleteMany({ user: req.user.id });
    // Remove profile
    await Profile.findOneAndRemove({ user: req.user.id });
    // Remove user
    await User.findOneAndRemove({ _id: req.user.id });

    res.json({ msg: 'User deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/profile/experience
// @desc     Add profile experience
// @access   Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From date is required and needs to be from the past')
        .not()
        .isEmpty()
        .custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    DELETE api/profile/experience/:exp_id
// @desc     Delete experience from profile
// @access   Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id });

    foundProfile.experience = foundProfile.experience.filter(
      (exp) => exp._id.toString() !== req.params.exp_id
    );

    await foundProfile.save();
    return res.status(200).json(foundProfile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Server error' });
  }
});

// @route    PUT api/profile/education
// @desc     Add profile education
// @access   Private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'School is required').not().isEmpty(),
      check('degree', 'Degree is required').not().isEmpty(),
      check('fieldofstudy', 'Field of study is required').not().isEmpty(),
      check('from', 'From date is required and needs to be from the past')
        .not()
        .isEmpty()
        .custom((value, { req }) => (req.body.to ? value < req.body.to : true)),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description,
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    DELETE api/profile/education/:edu_id
// @desc     Delete education from profile
// @access   Private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
    const foundProfile = await Profile.findOne({ user: req.user.id });
    foundProfile.education = foundProfile.education.filter(
      (edu) => edu._id.toString() !== req.params.edu_id
    );
    await foundProfile.save();
    return res.status(200).json(foundProfile);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: 'Server error' });
  }
});

//@route            PUT api/profile/github/:username
//@desc             Obtenir les depôts de l'utilisateur sur github
//@access           public
router.get('/github/:username', (req, res) => {
  try {
    const options = {
      uri: `https://api.github.com/users/${
        req.params.username
      }/repos?per_page=5&sort=created:asc&client_id=${config.get(
        'githubClientId'
      )}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: {
        'user-agent': 'node.js',
      },
    };

    request(options, (error, response, body) => {
      if (error) console.error(error);

      if (response.statusCode !== 200) {
        return res.status(404).json({
          msg: 'No Github profile found ',
        });
      }

      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

/*
const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const {
    check,
    validationResult
} = require('express-validator');
const Profile = require('../../models/Profile');
const User = require('../../models/User');

//@route            GET api/profile/me
//@desc             Get Current user profile
//@access           Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = Profile.findOne({
            user: req.user.id
        }).populate('user', ['name', 'avatar']);

        //verification de l'existence du profile
        if (!profile) {
            return res.status(400).json({
                msg: 'Il n\'y a pas de profile pour cet utilisateur '
            });
        }
        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur du serveur');
    }
});

//@route            Post api/profile
//@desc             Create or update user profile
//@access           Private
router.post('/', [
    auth,
    [
        check('status', 'status est requis').not().isEmpty(),
        check('skills', 'skills est requis').not().isEmpty()
    ]
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
    } = req.body;

    //Construction de l'objet profile
    const profileFields = {};
    profileFields.user = req.user.id;

    if (company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profile.githubusername = githubusername;
    if (skills) {
        profileFields.skills = skills.split(',').map(skill => skill.trim());
    }
    //console.log(profileFields.skills);
    //res.send('Hello');
    profileFields.social = {};
    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (linkedin) profileFields.social.linkedin = linkedin;
    if (instagram) profileFields.social.instagram = instagram;

    try {
        let profile = await Profile.findOne({
            user: req.user.id
        });

        if (profile) {
            //update
            profile = await Profile.findOneAndUpdate({
                user: req.user.id
            }, {
                $set: profileFields
            }, {
                new: true
            });
            return res.json(profile);
        }
        //insert
        profile = new Profile(profileFields);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(400).send('Server Error');
    }
    //console.log(profileFields.skills);
    //res.send('Hello');

});

//@route            GET api/profile
//@desc             Obtenir tous les profiles des utilisateurs
//@access           Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route            GET api/profile/user/:user_id
//@desc             Obtenir tous les profiles par l'id utilisateur
//@access           Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.params.user_id
        }).populate('user', ['name', 'avatar']);

        if (!profile) return res.status(400).json({
            msg: 'Profile not found'
        });

        res.json(profile);

    } catch (err) {
        console.error(err.message);

        if (err.kind == 'ObjectID') {
            return res.status(400).json({
                msg: 'Profile not found'
            });
        }

        res.status(500).send('Server Error');
    }
});

//@route            Delete api/profile
//@desc             Supprimer le profile, utilisateur et le post
//@access           Private
router.delete('/', auth, async (req, res) => {
    try {
        // @todo - remove users  posts

        // remove profile
        await Profile.findOneAndRemove({
            user: req.user.id
        });
        // remove user
        await User.findOneAndRemove({
            _id: req.user.id
        });

        res.json({
            msg: 'Utilisateur supprimer'
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route            PUT api/profile/Experience
//@desc             Add profile experience
//@access           Private

router.put('/experience', [auth, [
    check('title', 'title is required').not().isEmpty(),
    check('company', 'company is required').not().isEmpty(),
    check('from', 'from is required').not().isEmpty(),

]], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }

    const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    } = req.body;

    //creation de l'objet avec les données à soumise
    const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
    }

    //connect a mongo db
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        });
        profile.experience.unshift(newExp);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

//@route            DELETE api/profile/experience/:exp_id
//@desc             Delete experience from profile
//@access           Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        });

        //obtenir l'experience exacte a supprimer
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

        profile.experience.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route            PUT api/profile/education
//@desc             Add profile education
//@access           Private

router.put('/education', [auth, [
    check('school', 'school is required').not().isEmpty(),
    check('degree', 'degree is required').not().isEmpty(),
    check('fieldofstudy', 'field of study is required').not().isEmpty(),
    check('from', 'from is required').not().isEmpty(),

]], async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    }
    const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    } = req.body;

    //creation de l'objet avec les données à soumise
    const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
    }

    //connect a mongo db
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        });
        profile.education.unshift(newEdu);
        await profile.save();
        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }

});

//@route            DELETE api/profile/education/:edu_id
//@desc             Delete education from profile
//@access           Private

router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({
            user: req.user.id
        });

        //obtenir l'education exacte a supprimer
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//@route            PUT api/profile/github/:username
//@desc             Obtenir les depôts de l'utilisateur sur github
//@access           public
router.get('/github/:username', (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
            method: 'GET',
            headers: {
                'user-agent': 'node.js'
            }
        };

        request(options, (error, response, body) => {
            if (error) console.error(error);

            if (response.statusCode !== 200) {
                return res.status(404).json({
                    msg: 'No Github profile found '
                })
            }

            res.json(JSON.parse(body));
        })
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
})


module.exports = router;
*/
