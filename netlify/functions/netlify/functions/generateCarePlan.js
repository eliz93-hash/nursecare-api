exports.handler = async function (event) {

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let diagnosis;
  try {
    const body = JSON.parse(event.body);
    diagnosis = body.diagnosis;
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!diagnosis) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing diagnosis" }) };
  }

  const prompt = `You are an expert nursing educator. Generate a complete NANDA-I nursing care plan for the diagnosis: "${diagnosis}". Respond ONLY with a valid JSON object, no markdown, no extra text. Use exactly this structure: { "relatedTo": "string", "evidencedBy": ["s1","s2","s3","s4","s5"], "goals": ["goal1","goal2","goal3"], "interventions": [{"action":"intervention 1","rationale":"rationale 1"},{"action":"intervention 2","rationale":"rationale 2"},{"action":"intervention 3","rationale":"rationale 3"},{"action":"intervention 4","rationale":"rationale 4"},{"action":"intervention 5","rationale":"rationale 5"},{"action":"intervention 6","rationale":"rationale 6"}], "evaluation": "string", "priority": "high" } Priority must be one of: high, medium, or low.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Anthropic error:", errText);
      return { statusCode: 502, body: JSON.stringify({ error: "AI service error. Please try again." }) };
    }

    const data = await response.json();
    const text = data.content.map((c) => c.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();
    const plan = JSON.parse(clean);

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ plan }),
    };

  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate care plan. Please try again." }) };
  }
};
