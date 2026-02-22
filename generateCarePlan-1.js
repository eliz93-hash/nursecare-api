exports.handler = async function (event) {

  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  // Read the diagnosis from the request
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

  const prompt = `You are an expert nursing educator. Generate a complete NANDA-I nursing care plan for the diagnosis: "${diagnosis}".

Respond ONLY with a valid JSON object, no markdown, no extra text. Use exactly this structure:
{
  "relatedTo": "string describing related factors",
  "evidencedBy": ["symptom 1", "symptom 2", "symptom 3", "symptom 4", "symptom 5"],
  "goals": [
    "SMART goal 1 with timeframe",
    "SMART goal 2 with timeframe",
    "SMART goal 3 with timeframe"
  ],
  "interventions": [
    { "action": "specific nursing intervention 1", "rationale": "evidence-based rationale 1" },
    { "action": "specific nursing intervention 2", "rationale": "evidence-based rationale 2" },
    { "action": "specific nursing intervention 3", "rationale": "evidence-based rationale 3" },
    { "action": "specific nursing intervention 4", "rationale": "evidence-based rationale 4" },
    { "action": "specific nursing intervention 5", "rationale": "evidence-based rationale 5" },
    { "action": "specific nursing intervention 6", "rationale": "evidence-based rationale 6" }
  ],
  "evaluation": "string describing evaluation criteria and expected outcomes",
  "priority": "high"
}

Priority must be one of: "high", "medium", or "low".`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,   // Stored safely in Netlify dashboard
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
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "AI service error. Please try again." }),
      };
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
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate care plan. Please try again." }),
    };
  }
};
