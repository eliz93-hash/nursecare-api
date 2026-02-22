exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  const { name, age, diagnosis, symptoms, allergies, notes } = body;

  if (!diagnosis) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing diagnosis" }) };
  }

  const prompt = `You are an expert nursing educator. Generate a detailed nursing care plan for:
Patient: ${name || "Unknown"}, Age: ${age || "Unknown"}
Diagnosis: ${diagnosis}
Symptoms: ${symptoms || "None provided"}
Allergies: ${allergies || "None"}
Notes: ${notes || "None"}

Write a clear, detailed care plan including: nursing diagnosis, goals, interventions with rationale, and evaluation criteria.`;

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
    const carePlan = data.content.map((c) => c.text || "").join("");

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ carePlan }),
    };

  } catch (err) {
    console.error("Function error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Failed to generate care plan. Please try again." }) };
  }
};
