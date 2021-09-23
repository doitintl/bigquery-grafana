module.exports = async () => {
  // Perform all tests in the UTC timezone
  process.env.TZ = 'UTC';
};
