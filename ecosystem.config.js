module.exports = {
  apps: [
    {
      name: "digital-grievance-system",
      script: "./server/index.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
      },
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "./logs/err.log",
      out_file: "./logs/out.log",
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
    },
  ],
};
