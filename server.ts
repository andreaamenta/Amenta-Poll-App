import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

const DATA_FILE = path.join(process.cwd(), "data.json");

// Initial poll data for SIA 4th year
const initialData = {
  polls: [
    {
      id: "inf-1",
      question: "Quale linguaggio è più utilizzato per lo sviluppo lato server nel programma di 4^ SIA?",
      options: [
        { id: 1, text: "PHP", votes: 0 },
        { id: 2, text: "Java", votes: 0 },
        { id: 3, text: "C++", votes: 0 },
        { id: 4, text: "Python", votes: 0 }
      ]
    },
    {
      id: "eco-1",
      question: "Qual è lo scopo principale del Bilancio d'Esercizio?",
      options: [
        { id: 1, text: "Determinare reddito e patrimonio", votes: 0 },
        { id: 2, text: "Calcolare solo le imposte", votes: 0 },
        { id: 3, text: "Pianificare il marketing", votes: 0 },
        { id: 4, text: "Gestire il personale", votes: 0 }
      ]
    },
    {
      id: "db-1",
      question: "In un database relazionale, cosa garantisce l'univocità di una riga?",
      options: [
        { id: 1, text: "Chiave Primaria", votes: 0 },
        { id: 2, text: "Chiave Esterna", votes: 0 },
        { id: 3, text: "Indice non univoco", votes: 0 },
        { id: 4, text: "Attributo descrittivo", votes: 0 }
      ]
    },
    {
      id: "eco-2",
      question: "Il metodo della Partita Doppia si basa su quale uguaglianza?",
      options: [
        { id: 1, text: "Dare = Avere", votes: 0 },
        { id: 2, text: "Attivo = Passivo", votes: 0 },
        { id: 3, text: "Costi = Ricavi", votes: 0 },
        { id: 4, text: "Entrate = Uscite", votes: 0 }
      ]
    }
  ]
};

// In-memory cache for performance
let cachedData: any = null;

function loadData() {
  if (cachedData) return cachedData;

  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      if (data && data.polls) {
        cachedData = data;
        return cachedData;
      }
    } catch (e) {
      console.error("Error parsing data.json, resetting to initialData");
    }
  }
  
  cachedData = JSON.parse(JSON.stringify(initialData));
  saveData(cachedData);
  return cachedData;
}

function saveData(data: any) {
  cachedData = data;
  // Async write to not block the event loop
  fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), (err) => {
    if (err) console.error("Error saving data:", err);
  });
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/polls", (req, res) => {
    res.json(loadData().polls);
  });

  app.post("/api/vote-batch", (req, res) => {
    const { votes } = req.body; // Expecting { pollId: optionId }
    const data = loadData();
    let updated = false;

    for (const [pollId, optionId] of Object.entries(votes)) {
      const poll = data.polls.find((p: any) => p.id === pollId);
      if (poll) {
        const option = poll.options.find((o: any) => o.id === optionId);
        if (option) {
          option.votes += 1;
          updated = true;
        }
      }
    }

    if (updated) {
      saveData(data);
      res.json({ success: true, polls: data.polls });
    } else {
      res.status(400).json({ success: false, message: "No valid votes processed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
