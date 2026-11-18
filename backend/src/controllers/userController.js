const userService = require('../services/userService');

async function getMyProfile(req, res) {
  res.json({ data: req.user.toPublic() });
}

async function updateMyProfile(req, res) {
  const user = await userService.updateProfile(req.user._id, req.body);
  res.json({ data: user });
}

async function listUsers(req, res) {
  const result = await userService.listUsers(req.validated?.query || req.query);
  res.json(result);
}

async function getUserById(req, res) {
  const user = await userService.getUserById(req.params.id);
  res.json({ data: user });
}

async function adminUpdateUser(req, res) {
  const user = await userService.adminUpdateUser(req.params.id, req.body, req.user._id);
  res.json({ data: user });
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  listUsers,
  getUserById,
  adminUpdateUser,
};
