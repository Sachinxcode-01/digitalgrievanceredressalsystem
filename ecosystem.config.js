module.exports = {
  apps: [
    {
      name: 'digital-grievance-system',
      script: 'server/index.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      }
    }
  ]
};
