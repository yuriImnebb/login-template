const form = document.getElementById("formLogin");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("gmail").value;
  const senha = document.getElementById("senha").value;

  try {
    const resposta = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, senha }),
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      window.location.href = "/dashboard";
    } else {
      document.getElementById("mensagem").textContent = dados.erro;
    }
  } catch {
    document.getElementById("mensagem").textContent =
      "Erro ao conectar com o servidor";
  }
});
