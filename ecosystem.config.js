module.exports = {
  apps: [{
    name: 'elon-bot',
    script: 'elon-dm-replies.js',
    instances: 1,
    autorestart: true,
    watch: false, // Set to true if you want auto-reload on file changes
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/elon-error.log',
    out_file: './logs/elon-out.log',
    log_file: './logs/elon-combined.log',
    time: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    ignore_watch: ['node_modules', 'logs', '*.json']
  }]
}; 