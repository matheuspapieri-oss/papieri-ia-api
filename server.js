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

    const data = await resposta.json();

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
