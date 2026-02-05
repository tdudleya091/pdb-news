import { Resend } from "resend";
import { format } from "date-fns";
import type { DailyBrief } from "../types";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

export async function sendBriefEmail(
  brief: DailyBrief,
  recipientEmail: string
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) {
    console.error("Resend API key not configured");
    return false;
  }

  const html = renderBriefToHtml(brief);
  const dateStr = format(brief.date, "EEEE, MMMM d, yyyy");

  try {
    await resend.emails.send({
      from: "Daily Brief <brief@resend.dev>",
      to: recipientEmail,
      subject: `Daily Intelligence Brief - ${dateStr}`,
      html,
    });
    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
}

function renderBriefToHtml(brief: DailyBrief): string {
  const dateStr = format(brief.date, "EEEE, MMMM d, yyyy");
  const weather = brief.weather;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: Georgia, 'Times New Roman', serif; max-width: 650px; margin: 0 auto; padding: 20px; background: #f8f9fa;">
  <div style="background: white; padding: 30px; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

    <!-- Header -->
    <header style="border-bottom: 3px solid #1a365d; padding-bottom: 20px; margin-bottom: 25px;">
      <h1 style="color: #1a365d; margin: 0; font-size: 24px; letter-spacing: 1px;">
        DAILY INTELLIGENCE BRIEF
      </h1>
      <p style="color: #666; margin: 8px 0 0; font-size: 14px;">${dateStr}</p>
    </header>

    <!-- Weather Section -->
    <section style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
      <h2 style="margin: 0 0 15px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">
        Weather - ${weather.location}
      </h2>
      <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">
        ${weather.current.tempF}°F / ${weather.current.tempC}°C
      </div>
      <div style="font-size: 16px; text-transform: capitalize; margin-bottom: 15px;">
        ${weather.current.condition}
      </div>
      <div style="font-size: 13px; opacity: 0.9;">
        Humidity: ${weather.current.humidity}% · Wind: ${weather.current.windMph} mph
      </div>
      ${weather.forecast.length > 0 ? `
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3); display: flex; gap: 15px; flex-wrap: wrap;">
        ${weather.forecast.slice(0, 3).map(day => `
          <div style="text-align: center; min-width: 80px;">
            <div style="font-size: 12px; opacity: 0.8;">${format(new Date(day.date), 'EEE')}</div>
            <div style="font-size: 14px; font-weight: bold;">${day.highF}°/${day.lowF}°F</div>
            <div style="font-size: 11px; opacity: 0.8;">${day.highC}°/${day.lowC}°C</div>
          </div>
        `).join('')}
      </div>
      ` : ''}
    </section>

    <!-- Executive Summary -->
    <section style="background: #edf2f7; padding: 20px; margin-bottom: 25px; border-left: 4px solid #1a365d; border-radius: 0 4px 4px 0;">
      <h2 style="margin: 0 0 10px; font-size: 12px; text-transform: uppercase; color: #666; letter-spacing: 1px;">
        Executive Summary
      </h2>
      <p style="margin: 0; line-height: 1.7; color: #2d3748; font-size: 15px;">
        ${brief.executiveSummary}
      </p>
    </section>

    <!-- Sections -->
    ${brief.sections.map(section => `
    <section style="margin-bottom: 30px;">
      <h2 style="color: #1a365d; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px;">
        ${section.title}
      </h2>
      ${section.items.map(item => `
      <div style="margin-bottom: 20px; padding-left: 15px; border-left: 3px solid ${getConfidenceColor(item.confidenceLevel)};">
        <h3 style="margin: 0 0 8px; font-size: 16px; color: #2d3748;">
          ${item.headline}
        </h3>
        <p style="margin: 0 0 8px; color: #4a5568; line-height: 1.6; font-size: 14px;">
          ${item.summary}
        </p>
        <p style="margin: 0; font-size: 13px; color: #718096; font-style: italic;">
          <strong>Significance:</strong> ${item.significance}
        </p>
        <div style="margin-top: 8px; font-size: 11px; color: #a0aec0;">
          Sources: ${item.sources.join(', ')} · Confidence: ${item.confidenceLevel}
        </div>
      </div>
      `).join('')}
    </section>
    `).join('')}

    <!-- Footer -->
    <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; color: #a0aec0; font-size: 12px;">
      <p style="margin: 0;">
        Generated at ${format(brief.generatedAt, 'h:mm a')} · PDB News
      </p>
    </footer>

  </div>
</body>
</html>
  `;
}

function getConfidenceColor(level: string): string {
  switch (level) {
    case "HIGH":
      return "#48bb78";
    case "MEDIUM":
      return "#ed8936";
    case "LOW":
      return "#f56565";
    default:
      return "#a0aec0";
  }
}
