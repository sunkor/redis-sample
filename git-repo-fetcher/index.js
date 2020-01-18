const express = require("express");
const fetch = require("node-fetch");
const redis = require("redis");

const PORT = process.env.PORT || 8080;
const gitApiEndpoint = `https://api.github.com/users`;

const app = express();

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || "redis",
  port: process.env.REDIS_PORT || 6379
});

function setResponse(username, repos) {
  return `<h2>${username} has ${repos} Github repos</h2>`;
}

async function getRepos(req, res, next) {
  try {
    console.log("Fetching data...");

    const { username } = req.params;
    const response = await fetch(`${gitApiEndpoint}/${username}`);
    const data = await response.json();
    const repos = data.public_repos;

    //Set data to Redis.
    redisClient.setex(username, 3600, repos);

    res.send(setResponse(username, repos));
  } catch (err) {
    console.error(err);
    res.status(500); //Server error.
  }
}

function cache(req, res, next) {
  const { username } = req.params;

  redisClient.get(username, (err, data) => {
    if (err) throw err;
    if (data) {
      res.send(setResponse(username, data));
    } else {
      next();
    }
  });
}

app.get("/repos/:username", cache, getRepos);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
