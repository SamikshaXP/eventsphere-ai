import config from '../config/env.js';

export const generateAiExecutiveSummary = async ({ event, analytics, prediction, risks }) => {
  const apiKey = config.geminiApiKey || process.env.GEMINI_API_KEY || process.env.AI_API_KEY;

  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    return {
      aiSummary: null,
      aiAvailable: false
    };
  }

  // Construct structured prompt without any user PII
  const riskTypes = Array.isArray(risks) && risks.length > 0
    ? risks.map((r) => r.type).join(', ')
    : 'None detected';

  const prompt = `You are an AI event intelligence advisor. Provide a concise (2-3 sentence) executive summary for the event organizer based ONLY on the following verified metrics:

Event Title: "${event.title || 'Event'}"
Status: ${event.status || 'PUBLISHED'}
Capacity: ${event.capacity ? event.capacity : 'Uncapped'}
Confirmed Registrations: ${analytics.registrations.confirmed}
Capacity Utilization: ${analytics.capacity.utilizationRate !== null ? `${analytics.capacity.utilizationRate}%` : 'N/A'}
Demand Level: ${prediction.demandLevel} (Predicted: ${prediction.predictedRegistrations})
Check-in Rate: ${analytics.attendance.attendanceRate}%
Operational Risks: ${riskTypes}

Write a professional, factual, and actionable summary for the organizer. Do not hallucinate or include unprovided information.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4500);

  try {
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    
    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 200 }
          }),
          signal: controller.signal
        });

        if (response.ok) {
          clearTimeout(timeoutId);
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return {
              aiSummary: text.trim(),
              aiAvailable: true
            };
          }
        }
      } catch (err) {
        // Continue to next model on failure unless signal aborted
        if (controller.signal.aborted) break;
      }
    }

    clearTimeout(timeoutId);
    return {
      aiSummary: null,
      aiAvailable: false
    };
  } catch (error) {
    clearTimeout(timeoutId);
    // Graceful fallback on API error, missing key, or network timeout without crashing
    return {
      aiSummary: null,
      aiAvailable: false
    };
  }
};
