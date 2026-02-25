const http = require("http");
const os = require("os");

// console.log(http);
console.log(os.cpus().length);

http.createServer((req, res) => {
  console.log(req);
});
