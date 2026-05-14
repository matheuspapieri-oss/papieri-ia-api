const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const MAKE_WEBHOOK = "https://hook.us2.make.com/wk8r5h4qni7dgvoh7soh9f5j5m9od1ul";

let ultimaPergunta = "Nenhuma pergunta ainda";
let ultimaRespostaFinanceira = "Nenhuma consulta financeira ainda";
let ultimoFaturamento = "104044.26";
let ultimoPeriodo = "29/04/2026 a 05/05/2026";
let ultimoPedidos = "133";
let ultimaEmpresaDestaque = "Papieri 03";

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
    const data = JSON.parse(texto);

    if (typeof data.resposta === "string") {
      try {
        const respostaInterna = JSON.parse(data.resposta);
        return {
          status: "ok",
          resposta: respostaInterna.resposta || data.resposta
        };
      } catch {
        return {
          status: "ok",
          resposta: data.resposta
        };
      }
    }

    return data;
  } catch {
    return {
      status: "ok",
      resposta: texto
    };
  }
}

app.get("/", (req, res) => {
  res.json({
    status: "online",
    nome: "Papieri IA API",
    descricao: "API financeira conectada ao Make e compatível com leitura estilo Home Assistant"
  });
});

app.post("/financeiro", async (req, res) => {
  try {
    const pergunta = req.body.pergunta || "qual faturamento?";

    const data = await consultarMake(pergunta);

    ultimaPergunta = pergunta;
    ultimaRespostaFinanceira = data.resposta || JSON.stringify(data);

    res.json(data);
  } catch (error) {
    res.status(500).json({
      status: "erro",
      mensagem: "Falha ao consultar HUB financeiro",
      detalhe: error.message
    });
  }
});

app.get("/api/", (req, res) => {
  res.json({
    message: "API running."
  });
});

app.get("/api/states/:entity_id", (req, res) => {

  res.json({
    entity_id: "sensor.jarvis_financeiro",
    state: ultimaRespostaFinanceira || "Nenhuma consulta realizada ainda",
    attributes: {
      friendly_name: "Jarvis Financeiro",
      ultima_pergunta: ultimaPergunta,
      icon: "mdi:finance"
    },
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString()
  });

});

app.get("/api/states", (req, res) => {
  res.json([
    {
      entity_id: "sensor.faturamento_papieri",
      state: ultimoFaturamento,
      attributes: {
        friendly_name: "Faturamento Papieri",
        unit_of_measurement: "R$",
        icon: "mdi:cash"
      },
      last_changed: new Date().toISOString(),
      last_updated: new Date().toISOString()
    },
    {
      entity_id: "sensor.periodo_financeiro",
      state: ultimoPeriodo,
      attributes: {
        friendly_name: "Período Financeiro",
        icon: "mdi:calendar"
      },
      last_changed: new Date().toISOString(),
      last_updated: new Date().toISOString()
    },
    {
      entity_id: "sensor.pedidos_papieri",
      state: ultimoPedidos,
      attributes: {
        friendly_name: "Pedidos Papieri",
        icon: "mdi:package-variant"
      },
      last_changed: new Date().toISOString(),
      last_updated: new Date().toISOString()
    },
    {
      entity_id: "sensor.empresa_destaque_papieri",
      state: ultimaEmpresaDestaque,
      attributes: {
        friendly_name: "Empresa Destaque Papieri",
        icon: "mdi:trophy"
      },
      last_changed: new Date().toISOString(),
      last_updated: new Date().toISOString()
    },
    {
      entity_id: "sensor.resumo_financeiro_papieri",
      state: ultimaRespostaFinanceira,
      attributes: {
        friendly_name: "Resumo Financeiro Papieri",
        ultima_pergunta: ultimaPergunta,
        icon: "mdi:chart-line"
      },
      last_changed: new Date().toISOString(),
      last_updated: new Date().toISOString()
    }
  ]);
});

app.get("/api/states/:entity_id", (req, res) => {
  const entityId = req.params.entity_id;

  const states = [
    {
      entity_id: "sensor.faturamento_papieri",
      state: ultimoFaturamento,
      attributes: {
        friendly_name: "Faturamento Papieri",
        unit_of_measurement: "R$",
        icon: "mdi:cash"
      }
    },
    {
      entity_id: "sensor.resumo_financeiro_papieri",
      state: ultimaRespostaFinanceira,
      attributes: {
        friendly_name: "Resumo Financeiro Papieri",
        ultima_pergunta: ultimaPergunta,
        icon: "mdi:chart-line"
      }
    }
  ];

  const found = states.find((item) => item.entity_id === entityId);

  if (!found) {
    return res.status(404).json({
      message: "Entity not found."
    });
  }

  res.json({
    ...found,
    last_changed: new Date().toISOString(),
    last_updated: new Date().toISOString()
  });
});

app.post("/api/services/:domain/:service", async (req, res) => {
  try {
    const pergunta =
      req.body.pergunta ||
      req.body.message ||
      req.body.text ||
      "qual faturamento?";

    const data = await consultarMake(pergunta);

    ultimaPergunta = pergunta;
    ultimaRespostaFinanceira = data.resposta || JSON.stringify(data);

    res.json([
      {
        entity_id: "sensor.resumo_financeiro_papieri",
        state: ultimaRespostaFinanceira,
        attributes: {
          friendly_name: "Resumo Financeiro Papieri",
          ultima_pergunta: ultimaPergunta
        }
      }
    ]);
  } catch (error) {
    res.status(500).json({
      status: "erro",
      mensagem: "Falha ao executar serviço financeiro",
      detalhe: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Papieri IA API online na porta ${PORT}`);
});
