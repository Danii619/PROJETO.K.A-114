/* =========================================================
   PROJECT114 — identidade.js
   Código de identificação local do jogador (estático, sem backend).

   - Formato: string de 4 caracteres, sempre "0" + 3 dígitos ("0000"–"0999").
   - Gerado na primeira visita e salvo em localStorage ("ka114_codigo").
   - Identifica apenas esta instalação/navegador. Não é conta
     autenticada nem identificador globalmente único.

   Uso nas páginas:
     <script src="identidade.js"></script>
     obterCodigoJogador()                 -> "0472"
     <span data-codigo-jogador></span>    -> preenchido automaticamente

   Descobertas (base para futuras áreas, sem desbloqueios próprios):
     registrarDescoberta("id-da-descoberta")
     temDescoberta("id-da-descoberta")    -> true/false
     listarDescobertas()                  -> { "id": "2026-10-25T...", ... }
   ========================================================= */
(function (global) {
  "use strict";

  var CHAVE_CODIGO = "ka114_codigo";
  var CHAVE_DESCOBERTAS = "ka114_descobertas";

  // Reserva em memória, usada só se o localStorage estiver bloqueado
  // (modo privado restrito, política do navegador etc.).
  var codigoEmMemoria = null;
  var descobertasEmMemoria = {};

  function codigoValido(c) {
    return typeof c === "string" && /^0[0-9]{3}$/.test(c);
  }

  function gerarCodigo() {
    var n;
    if (global.crypto && typeof global.crypto.getRandomValues === "function") {
      var a = new Uint32Array(1);
      global.crypto.getRandomValues(a);
      n = a[0] % 1000;
    } else {
      n = Math.floor(Math.random() * 1000);
    }
    // String(n).padStart evita perder zeros: 6 -> "006" -> "0006"
    return "0" + String(n).padStart(3, "0");
  }

  function lerStorage(chave) {
    try { return global.localStorage.getItem(chave); } catch (e) { return null; }
  }

  function gravarStorage(chave, valor) {
    try { global.localStorage.setItem(chave, valor); return true; } catch (e) { return false; }
  }

  function obterCodigoJogador() {
    var salvo = lerStorage(CHAVE_CODIGO);
    if (codigoValido(salvo)) return salvo;

    if (codigoValido(codigoEmMemoria)) return codigoEmMemoria;

    var novo = gerarCodigo();
    if (gravarStorage(CHAVE_CODIGO, novo)) {
      // Relê para respeitar um código gravado por outra aba ao mesmo tempo.
      var confirmado = lerStorage(CHAVE_CODIGO);
      return codigoValido(confirmado) ? confirmado : novo;
    }
    codigoEmMemoria = novo;
    return novo;
  }

  /* ---------- descobertas ---------- */

  function lerDescobertas() {
    var bruto = lerStorage(CHAVE_DESCOBERTAS);
    if (!bruto) return descobertasEmMemoria;
    try {
      var obj = JSON.parse(bruto);
      return (obj && typeof obj === "object" && !Array.isArray(obj)) ? obj : {};
    } catch (e) {
      return {};
    }
  }

  function registrarDescoberta(id) {
    if (typeof id !== "string" || !id) return false;
    var atual = lerDescobertas();
    if (atual[id]) return true; // já registrada; mantém a data original
    atual[id] = new Date().toISOString();
    if (!gravarStorage(CHAVE_DESCOBERTAS, JSON.stringify(atual))) {
      descobertasEmMemoria[id] = atual[id];
    }
    return true;
  }

  function temDescoberta(id) {
    return Object.prototype.hasOwnProperty.call(lerDescobertas(), id);
  }

  function listarDescobertas() {
    var atual = lerDescobertas();
    var copia = {};
    Object.keys(atual).forEach(function (k) { copia[k] = atual[k]; });
    return copia;
  }

  /* ---------- preenchimento automático ---------- */

  function preencherCodigo() {
    var codigo = obterCodigoJogador();
    var alvos = document.querySelectorAll("[data-codigo-jogador]");
    for (var i = 0; i < alvos.length; i++) alvos[i].textContent = codigo;
  }

  if (typeof document !== "undefined") {
    // Preenche o que já foi lido (script no fim do body evita o "flash")...
    preencherCodigo();
    // ...e garante os elementos que ainda não existiam (script no head).
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", preencherCodigo);
    }
  }

  global.obterCodigoJogador = obterCodigoJogador;
  global.registrarDescoberta = registrarDescoberta;
  global.temDescoberta = temDescoberta;
  global.listarDescobertas = listarDescobertas;
})(window);
