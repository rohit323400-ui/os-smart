module.exports = {
  apps: [
    {
      name: 'raah-nagar-backend',
      script: './server/server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
