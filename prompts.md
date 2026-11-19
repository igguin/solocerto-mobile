# Prompts utilizados

Registro dos prompts usados com IA generativa (Claude Code) durante o desenvolvimento do app SoloCerto.

---

## Prompt 1: criação do app (15/11/2026)

**Ferramenta:** Claude Code (extensão do VS Code)

**Objetivo:** gerar a estrutura inicial do app com telas, consumo de dados, banco local, acessibilidade e documentação.

```text
Crie um app mobile com Expo + React Native + TypeScript + Expo Router para a Global Solution FIAP "CitizenTech".

CONTEXTO
- Nome: SoloCerto. Cidadão: pequeno produtor rural. Problema: ele irriga "no olho", desperdiçando água ou perdendo produção.
- Um dispositivo ESP32 mede a umidade do solo e envia leituras a uma API. O app é a porta de entrada do produtor: ele vê a situação do solo, o histórico e confirma "Irriguei".
- A API real (Java/Spring Boot, do meu grupo) ainda não tem o endpoint de leituras, então por enquanto o app usa um MOCK.

CONTRATO DE DADOS (mesmo formato que o ESP32 envia)
{ "id": number, "plantacaoId": number, "evento": "leitura" | "alerta_critico" | "irrigacao_confirmada",
  "umidadeSolo": 0-100, "umidadeAr": number|null, "temperaturaAr": number|null,
  "estado": "CRITICO" | "MODERADO" | "BOM", "tempoReacaoSeg": number|null, "criadoEm": ISO string }
Regras de estado: <=30 CRITICO, <=70 MODERADO, >70 BOM.
Dados da propriedade (fictícios): agricultor "Carlos Ferreira", cidade "Campinas", plantação de soja, 8,5 hectares.

REQUISITOS (rubrica: telas e navegação, consumo de dados, banco de dados, acessibilidade, aderência ao problema, documentação)
1. Expo Router com 3 telas em abas:
   - "Hoje": umidade atual grande, estado por cor + texto + ícone, última atualização e botão grande "Irriguei".
   - "Histórico": lista das leituras e eventos, mais um gráfico simples (sem biblioteca pesada).
   - "Ajuda": o que significam as cores e o que fazer em cada estado, em linguagem simples.
2. Consumo de dados: src/services/api.ts com uma interface única (getLeituras, getUltimaLeitura, registrarIrrigacao). Implemente o MOCK (src/services/mockApi.ts) gerando leituras simuladas que variam com o tempo, inclusive um alerta crítico de vez em quando. Deixe uma implementação httpApi.ts (fetch) pronta, escolhida por EXPO_PUBLIC_USE_MOCK, usando EXPO_PUBLIC_API_URL. Trocar mock por API real não pode exigir mudar as telas.
3. Banco de dados: expo-sqlite guardando as leituras e os eventos "Irriguei", para o histórico funcionar sem internet.
4. O botão "Irriguei" grava o evento no SQLite com o tempo de reação desde o último alerta crítico (se houver) e o envia pela camada de API.
5. Acessibilidade: fonte grande, alto contraste, alvos de toque >= 48px, accessibilityLabel/accessibilityRole em tudo, o estado nunca só por cor, textos curtos em português simples.
6. Mostrar aviso claro quando estiver sem internet.
7. Sem dados pessoais reais; use apenas dados simulados.

ENTREGA
- Código organizado: app/, src/components, src/services, src/db, src/types.
- README.md com: a Ficha da CitizenTech no topo (nome, cidade/bairro, cidadão, problema em uma frase, como funciona, o que cada parte faz, link do repositório, indicador de impacto, ODS 2, 13, 9 e 10), como rodar o app (npm install, npx expo start) e uma seção para prints das telas.
- prompts.md registrando os prompts que usei.
- Comece simples e faça o básico funcionar antes de incrementar. Explique cada arquivo que criar, porque preciso saber explicar o projeto.
```

**Resultado:** projeto criado com Expo SDK 58, 3 abas, camada de API (mock + http), SQLite com suporte offline, componentes acessíveis, README e este arquivo.

**O que revisamos/ajustamos depois: melhoramos a interface e alguns ajustes 

---


