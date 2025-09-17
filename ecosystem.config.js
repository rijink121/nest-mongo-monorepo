const pkg = require('./package.json');

module.exports = {
  apps: [
    {
      name: `${pkg.name}-main`,
      script: 'dist/apps/main/main.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
    {
      name: `${pkg.name}-admin`,
      script: 'dist/apps/admin/main.js',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
};
