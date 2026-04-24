const express = require("express");
const cors = require("cors");
const { processBfhlData, USER_PROFILE } = require("./dataProcessor");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "bfhl-api"
  });
});

app.get("/bfhl", (_req, res) => {
  res.json({
    operation_code: 1,
    ...USER_PROFILE
  });
});

app.post("/bfhl", (req, res) => {
  if (!req.is("application/json")) {
    return res.status(415).json({
      error: "Content-Type must be application/json"
    });
  }

  if (!req.body || !Array.isArray(req.body.data)) {
    return res.status(400).json({
      error: "Request body must be a JSON object with a data array"
    });
  }

  return res.json(processBfhlData(req.body.data));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({
    error: "Something went wrong"
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`BFHL API listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
