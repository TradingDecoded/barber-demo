module.exports = {
  apps: [
    {
      name: "barber-demo",
      script: ".next/standalone/server.js",
      cwd: "/var/www/barber-demo",
      env: {
        NODE_ENV: "production",
        PORT: 3101,
      },
    },
  ],
};