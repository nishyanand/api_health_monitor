// Temporary in-memory user store
// We will replace this with PostgreSQL in the next step
const users = [];

// Find user by email
function findUserByEmail(email) {
  return users.find((u) => u.email === email) || null;
}

// Find user by id
function findUserById(id) {
  return users.find((u) => u.id === id) || null;
}

// Create new user
function createUser({ id, name, email, password }) {
  const newUser = { id, name, email, password };
  users.push(newUser);
  return newUser;
}

module.exports = { findUserByEmail, findUserById, createUser };