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


// HOME ASSISTANT FAKE

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

app.post("/api/services/:domain/:service", async (req, res) => {

  try {

    const pergunta = req.body.entity_id || "consulta financeira";

    const resposta = await fetch(MAKE_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        pergunta
      })
    });

    const data = await resposta.json();

    console.log("Pergunta:", pergunta);
    console.log("Resposta:", data);

    res.json({
      success: true,
      resposta: data
    });

  } catch (error) {

    res.status(500).json({
      erro: true,
      mensagem: error.message
    });

  }

});

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor online");
});
