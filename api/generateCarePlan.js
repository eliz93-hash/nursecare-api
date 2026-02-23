export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, age, diagnosis, symptoms, allergies, notes } = req.body;

  if (!diagnosis) {
    return res.status(400).json({ error: "Missing diagnosis" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
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
        "x-api-key": apiKey,
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
      return res.status(502).json({ error: "AI error: " + errText });
    }

    const data = await response.json();
    const carePlan = data.content.map((c) => c.text || "").join("");
    return res.status(200).json({ carePlan });

  } catch (err) {
    return res.status(500).json({ error: "Failed: " + err.message });
  }
}
