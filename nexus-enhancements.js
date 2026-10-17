
document.addEventListener("DOMContentLoaded", () => {
    const reportButton = document.createElement("button");

    reportButton.type = "button";
    reportButton.textContent = "⬇ Download Weather Report";
    reportButton.id = "download-weather-report";

    reportButton.style.cssText = `
        padding: 12px 18px;
        margin: 12px 0;
        border: none;
        border-radius: 10px;
        background: #2563eb;
        color: white;
        font-weight: 600;
        cursor: pointer;
    `;

    const dashboard = document.querySelector("main");
    const topbar = document.querySelector(".topbar");

    if (!dashboard || !topbar) return;

    topbar.insertAdjacentElement("afterend", reportButton);

    reportButton.addEventListener("click", () => {
        const getText = (id) =>
            document.getElementById(id)?.textContent.trim() || "Not available";

        const city = getText("location-info");
        const temperature = getText("temperature-info");
        const condition = getText("condition-info");
        const feelsLike = getText("feels-like-info");
        const humidity = getText("humidity-info");
        const wind = getText("wind-info");
        const airQuality = getText("air-info");
        const safety = getText("safety-info");
        const forecast = getText("forecast-info");

        if (city === "Search a city") {
            alert("Please search for a city before downloading the report.");
            return;
        }

        const report = `
NEXUS — WEATHER REPORT
======================

City: ${city}
Generated: ${new Date().toLocaleString()}

CURRENT WEATHER
Temperature: ${temperature}
Condition: ${condition}
Feels Like: ${feelsLike}
Humidity: ${humidity}
Wind Speed: ${wind}

AIR QUALITY
${airQuality}

SAFETY INDICATOR
${safety}

FORECAST
${forecast}

Note: Weather information may change.
The safety indicator is illustrative, not an official risk assessment.
        `.trim();

        const blob = new Blob([report], {
            type: "text/plain;charset=utf-8"
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `NEXUS-Weather-Report.txt`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    });
});
