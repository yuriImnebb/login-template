const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = 3000;

const PUBLIC = path.join(__dirname, "public");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env",
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

app.use(express.json());

app.use(
  session({
    name: "sessao",
    secret:
      process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

app.post("/api/registro", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (
      typeof email !== "string" ||
      typeof senha !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      senha.length < 8
    ) {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const emailNormalizado = email.trim().toLowerCase();
    const hash = await bcrypt.hash(senha, 12);
    const { error } = await supabase.from("usuarios").insert({
      email: emailNormalizado,
      senha: hash,
    });

    if (error?.code === "23505") {
      return res.status(409).json({ erro: "Email já cadastrado" });
    }
    if (error) throw error;

    res.status(201).json({ mensagem: "Conta criada" });
  } catch {
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, senha } = req.body;

    if (typeof email !== "string" || typeof senha !== "string") {
      return res.status(400).json({ erro: "Dados inválidos" });
    }

    const { data: usuario, error } = await supabase
      .from("usuarios")
      .select("id, senha")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (error) throw error;

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ erro: "Email ou senha incorretos" });
    }

    req.session.usuarioId = usuario.id;

    req.session.save((erro) => {
      if (erro) return res.status(500).json({ erro: "Erro na sessão" });
      res.json({ mensagem: "Login realizado" });
    });
  } catch {
    res.status(500).json({ erro: "Erro no servidor" });
  }
});

function autenticado(req, res, next) {
  if (!req.session.usuarioId) {
    return res.redirect("/");
  }
  next();
}

app.get("/dashboard", autenticado, (req, res) => {
  res.sendFile(path.join(PUBLIC, "dashboard.html"));
});

app.post("/api/logout", (req, res) => {
  req.session.destroy((erro) => {
    if (erro) return res.status(500).json({ erro: "Erro ao sair" });
    res.clearCookie("sessao");
    res.json({ mensagem: "Logout realizado" });
  });
});

app.use(express.static(PUBLIC, { index: "index.html" }));

app.listen(PORT, () => {
  console.log(`Servidor: http://localhost:${PORT}`);
});
