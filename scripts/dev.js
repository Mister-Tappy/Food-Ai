const { spawn } = require("node:child_process");

const processes = [
  spawn("npm", ["run", "dev", "--prefix", "server"], { shell: true, stdio: "inherit" }),
  spawn("npm", ["run", "dev", "--prefix", "client"], { shell: true, stdio: "inherit" }),
];

function shutdown(signal) {
  processes.forEach((process) => process.kill(signal));
}

process.on("SIGINT", () => { shutdown("SIGINT"); process.exit(0); });
process.on("SIGTERM", () => { shutdown("SIGTERM"); process.exit(0); });
processes.forEach((process) => process.on("exit", (code) => {
  if (code && code !== 0) { shutdown("SIGTERM"); process.exitCode = code; }
}));
