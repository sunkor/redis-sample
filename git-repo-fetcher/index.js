const express = require("express");
const fetch = require("node-fetch");
const asyncRedis = require("async-redis");

const PORT = process.env.PORT || 8080;
const gitApiEndpoint = `https://api.github.com/users`;

const app = express();

const asyncRedisClient = asyncRedis.createClient({
  host: process.env.REDIS_HOST || "redis",
  port: process.env.REDIS_PORT || 6379
});

function setResponse(username, repos) {
  return `<h2>${username} has ${
    JSON.parse(repos).repo_count
  } Github repos</h2>`;
}

async function getRepos(req, res, next) {
  try {
    console.log("Fetching data...");

    const { username } = req.params;
    const response = await fetch(`${gitApiEndpoint}/${username}`);
    const data = await response.json();
    const repos = JSON.stringify({
      repo_count: data.public_repos
    });

    //Set data to Redis.
    await asyncRedisClient.setex(username, 3600, repos);

    res.send(setResponse(username, repos));
  } catch (err) {
    console.error(err);
    res.status(500); //Server error.
  }
}

async function cache(req, res, next) {
  const { username } = req.params;

  const repos = await asyncRedisClient.get(username);
  const ignoreCache = req.query.ignoreCache == "true";
  if (repos && !ignoreCache) {
    res.send(setResponse(username, repos));
  } else {
    next();
  }
}

app.get("/repos/:username", cache, getRepos);

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
