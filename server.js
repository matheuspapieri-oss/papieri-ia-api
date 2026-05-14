const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const MAKE_WEBHOOK = "https://hook.us2.make.com/wk8r5h4qni7dgvoh7soh9f5j5m9od1ul";

app.post("/financeiro", async (req, res) => {

  try {

    const resposta = await fetch(MAKE_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pergunta: req.body.pergunta
      })
    });

    const texto = await resposta.text();

    let data;

    try {
      data = JSON.parse(texto);
    } catch {
      return res.json({
        status: "erro",
        resposta: texto
      });
    }

    if (typeof data === "string") {
      data = JSON.parse(data);
    }

    res.json(data);

  } catch (error) {

    res.status(500).json({
      erro: true,
      mensagem: error.message
    });

  }

});

app.get("/", (req, res) => {
  res.send("IA Papieri Online");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor online");
});

const express = require("express");
const axios = require("axios");

const app = express();

app.use(express.json());

app.post("/financeiro", async (req, res) => {

  try {

    const resposta = await axios.post(
      "SEU_WEBHOOK_MAKE",
      req.body
    );

    res.json({
      status: "ok",
      resposta: resposta.data
    });

  } catch (erro) {

    res.status(500).json({
      erro: true,
      mensagem: erro.message
    });

  }

});


// ADICIONE AQUI EMBAIXO

app.get("/", (req, res) => {
  res.json({
    message: "Home Assistant Fake Online"
  });
});

app.get("/api/", (req, res) => {
  res.json({
    message: "API OK"
  });
});

app.get("/api/states", (req, res) => {
  res.json([]);
});

app.get("/api/config", (req, res) => {
  res.json({
    location_name: "Papieri",
    version: "2026.1",
    unit_system: {
      temperature: "°C"
    }
  });
});


app.listen(8080, () => {
  console.log("Servidor online");
});
