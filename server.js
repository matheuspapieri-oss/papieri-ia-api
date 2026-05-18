const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const MAKE_WEBHOOK = "https://hook.us2.make.com/wk8r5h4qni7dgvoh7soh9f5j5m9od1ul";

let ultimaPergunta = "Nenhuma pergunta ainda";
let ultimaRespostaFinanceira = "Nenhuma consulta financeira ainda";
let ultimaAtualizacao = new Date().toISOString();

function extrairResposta(valor) {
  if (!valor) return "Nenhuma resposta encontrada.";

  let atual = String(valor).trim();

  for (let i = 0; i < 5; i++) {
    try {
      const parsed = JSON.parse(atual);

      if (parsed && typeof parsed === "object" && parsed.resposta) {
        atual = String(parsed.resposta).trim();
        continue;
      }

      if (typeof parsed === "string") {
        atual = parsed.trim();
        continue;
      }

      return JSON.stringify(parsed);
    } catch {
      break;
    }
  }

  const match = atual.match(/"resposta"\s*:\s*"([\s\S]*?)"\s*\r?\n?\}/);

  if (match && match[1]) {
    return match[1]
      .replace(/\\"/g, "\"")
      .replace(/\\r/g, "")
      .replace(/\\n/g, "\n")
      .trim();
  }

  return atual;
}

function montarSensorFinanceiro() {
  return {
    entity_id: "sensor.jarvis_financeiro",
    state: "disponivel",
    attributes: {
      friendly_name: "Jarvis Financeiro",
      ultima_pergunta: ultimaPergunta,
      resposta_completa: ultimaRespostaFinanceira,
      icon: "mdi:finance"
    },
    last_changed: ultimaAtualizacao,
    last_updated: ultimaAtualizacao
  };
}

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

    return {
      status: "ok",
      resposta: extrairResposta(data.resposta || texto)
    };
  } catch {
    return {
      status: "ok",
      resposta: extrairResposta(texto)
    };
  }
}

async function executarConsultaFinanceira(pergunta) {
  const perguntaFinal = pergunta || "qual faturamento?";

  const data = await consultarMake(perguntaFinal);

  ultimaPergunta = perguntaFinal;
  ultimaRespostaFinanceira = data.resposta;
  ultimaAtualizacao = new Date().toISOString();

  return data;
}

app.get("/", (req, res) => {
  res.json({
    status: "online",
    nome: "Papieri IA API",
    descricao: "API financeira conectada ao Make e compatível com leitura estilo Home Assistant",
    endpoints: {
      financeiro: "POST /financeiro",
      states: "GET /api/states",
      service: "POST /api/services/jarvis/financeiro"
    }
  });
});

app.post("/financeiro", async (req, res) => {
  try {
    const pergunta =
      req.body.pergunta ||
      req.body.message ||
      req.body.text ||
      req.body.command ||
      "qual faturamento?";

    const data = await executarConsultaFinanceira(pergunta);

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

app.get("/api/config", (req, res) => {
  res.json({
    latitude: -23.5505,
    longitude: -46.6333,
    elevation: 760,
    unit_system: {
      length: "km",
      mass: "kg",
      temperature: "°C",
      volume: "L"
    },
    location_name: "Papieri IA",
    time_zone: "America/Sao_Paulo",
    components: ["sensor"],
    config_dir: "/config",
    version: "2026.5.0"
  });
});

app.get("/api/states", (req, res) => {
  res.json([
    montarSensorFinanceiro()
  ]);
});

app.get("/api/states/sensor.jarvis_financeiro", (req, res) => {
  res.json(montarSensorFinanceiro());
});

app.get("/api/states/:entity_id", (req, res) => {
  res.json(montarSensorFinanceiro());
});

app.post("/api/services/jarvis/financeiro", async (req, res) => {
  try {
    const pergunta =
      req.body.pergunta ||
      req.body.message ||
      req.body.text ||
      req.body.command ||
      req.body.service_data?.pergunta ||
      req.body.service_data?.message ||
      req.body.service_data?.text ||
      "qual faturamento?";

    await executarConsultaFinanceira(pergunta);

    res.json([
      montarSensorFinanceiro()
    ]);
  } catch (error) {
    res.status(500).json({
      status: "erro",
      mensagem: "Falha ao executar serviço financeiro",
      detalhe: error.message
    });
  }
});

app.post("/api/services/:domain/:service", async (req, res) => {
  try {
    const domain = req.params.domain;
    const service = req.params.service;

    const pergunta =
      req.body.pergunta ||
      req.body.message ||
      req.body.text ||
      req.body.command ||
      req.body.service_data?.pergunta ||
      req.body.service_data?.message ||
      req.body.service_data?.text ||
      `${domain}.${service}`;

    await executarConsultaFinanceira(pergunta);

    res.json([
      montarSensorFinanceiro()
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
