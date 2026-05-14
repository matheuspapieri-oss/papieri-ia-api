const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const MAKE_WEBHOOK = "https://hook.us2.make.com/wk8r5h4qni7dgvoh7soh9f5j5m9od1ul";

let ultimoFaturamentoMarco = "carregando";
let ultimaRespostaFinanceira = "Nenhuma consulta ainda";

async function consultarMake(pergunta) {
  const resposta = await fetch(MAKE_WEBHOOK, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ pergunta })
  });

  const texto = await resposta.text();

  try {
    return JSON.parse(texto);
  } catch {
    return {
      status: "erro",
      resposta: texto
    };
  }
}

function extrairValorFaturamento(texto) {
  if (!texto) return "sem dados";

  const match = texto.match(/R\$\s?[\d\.\,]+/);

  if (match) {
    return match[0];
  }

  return "consultado";
}


// ===============================
// CONSULTA FINANCEIRA DIRETA
// ===============================

app.post("/financeiro", async (req, res) => {
  try {
    const pergunta = req.body.pergunta || "qual faturamento de março?";

    const data = await consultarMake(pergunta);

    ultimaRespostaFinanceira = data.resposta || JSON.stringify(data);

    if (pergunta.toLowerCase().includes("março") || pergunta.toLowerCase().includes("marco")) {
      ultimoFaturamentoMarco = extrairValorFaturamento(ultimaRespostaFinanceira);
    }

    res.json(data);

  } catch (error) {
    res.status(500).json({
      erro: true,
      mensagem: error.message
    });
  }
});


// ===============================
// HOME ASSISTANT FAKE
// ===============================

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


// ===============================
// SENSORES FINANCEIROS DINÂMICOS
// ===============================

app.get("/api/states", async (req, res) => {
  try {
    const data = await consultarMake("qual faturamento de março?");

    ultimaRespostaFinanceira = data.resposta || JSON.stringify(data);
    ultimoFaturamentoMarco = extrairValorFaturamento(ultimaRespostaFinanceira);

    res.json([
      {
        entity_id: "sensor.faturamento_marco",
        state: ultimoFaturamentoMarco,
        attributes: {
          friendly_name: "faturamento março",
          resposta_completa: ultimaRespostaFinanceira
        }
      },
      {
        entity_id: "sensor.resumo_financeiro",
        state: "disponível",
        attributes: {
          friendly_name: "resumo financeiro",
          resposta_completa: ultimaRespostaFinanceira
        }
      },
      {
        entity_id: "sensor.faturamento_atual",
        state: ultimoFaturamentoMarco,
        attributes: {
          friendly_name: "faturamento atual",
          resposta_completa: ultimaRespostaFinanceira
        }
      }
    ]);

  } catch (error) {
    res.json([
      {
        entity_id: "sensor.faturamento_marco",
        state: "erro",
        attributes: {
          friendly_name: "faturamento março",
          erro: error.message
        }
      }
    ]);
  }
});


// ===============================
// INTERCEPTA COMANDOS DA ASNO
// ===============================

app.post("/api/services/:domain/:service", async (req, res) => {
  try {
    const entity = req.body.entity_id || "";
    let pergunta = "qual faturamento de março?";

    if (entity.includes("resumo_financeiro")) {
      pergunta = "qual resumo financeiro?";
    }

    if (entity.includes("faturamento_atual")) {
      pergunta = "qual faturamento atual?";
    }

    if (entity.includes("faturamento_marco")) {
      pergunta = "qual faturamento de março?";
    }

    const data = await consultarMake(pergunta);

    ultimaRespostaFinanceira = data.resposta || JSON.stringify(data);
    ultimoFaturamentoMarco = extrairValorFaturamento(ultimaRespostaFinanceira);

    res.json({
      success: true,
      data
    });

  } catch (error) {
    res.status(500).json({
      erro: true,
      mensagem: error.message
    });
  }
});


// ===============================
// CONFIG FAKE HOME ASSISTANT
// ===============================

app.get("/api/config", (req, res) => {
  res.json({
    location_name: "Papieri",
    version: "2026.1",
    unit_system: {
      temperature: "°C"
    }
  });
});


// ===============================
// START SERVER
// ===============================

app.listen(process.env.PORT || 3000, () => {
  console.log("Servidor online");
});
