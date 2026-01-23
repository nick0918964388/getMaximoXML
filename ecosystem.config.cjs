module.exports = {
  apps: [{
    name: 'maximo-xml-generator',
    cwd: './web',
    script: 'npm',
    args: 'start',
    interpreter: 'none',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    watch: false,
    exec_mode: 'fork',
    instances: 1,
    autorestart: true,
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
