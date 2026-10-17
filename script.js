
/* ========================================
   NEXUS — ELEMENT SELECTION
======================================== */

const cityInput = document.querySelector("#city-search");
const cityForm = document.querySelector("#city-form");
const message = document.querySelector("#message");

const safetyInfo = document.querySelector("#safety-info");
const airInfo = document.querySelector("#air-info");
const forecastInfo = document.querySelector("#forecast-info");

const temperatureInfo = document.querySelector("#temperature-info");
const feelsLikeInfo = document.querySelector("#feels-like-info");
const humidityInfo = document.querySelector("#humidity-info");
const windInfo = document.querySelector("#wind-info");
const conditionInfo = document.querySelector("#condition-info");
const locationInfo = document.querySelector("#location-info");

const favoriteCity = document.querySelector("#favorite-city");
const addFavorite = document.querySelector("#add-favorite");
const favoriteList = document.querySelector("#favorite-list");

let currentRequest = 0;

/* ========================================
   FAVORITE CITIES
======================================== */

let favoriteCities = [];

try {
    const saved = JSON.parse(localStorage.getItem("nexus-favorites"));

    if (Array.isArray(saved)) {
        favoriteCities = saved.filter(city => typeof city === "string");
    }
} catch (error) {
    favoriteCities = [];
}

function saveFavorites() {
    try {
        localStorage.setItem(
            "nexus-favorites",
            JSON.stringify(favoriteCities)
        );
    } catch (error) {
        console.warn("Unable to save favorites:", error);
    }
}

function showFavorites() {
    if (!favoriteList) return;

    favoriteList.replaceChildren();

    if (favoriteCities.length === 0) {
        const empty = document.createElement("li");
        empty.textContent = "No favorite cities yet.";
        empty.style.padding = "10px 12px";
        empty.style.color = "#718096";
        favoriteList.appendChild(empty);
        return;
    }

    favoriteCities.forEach(city => {
        const item = document.createElement("li");
        const button = document.createElement("button");

        button.type = "button";
        button.className = "favorite-city-btn";
        button.textContent = "📍 " + city;

        button.addEventListener("click", () => {
            if (cityInput) cityInput.value = city;

            searchCity(city);

            document.querySelector("#home")?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        });

        item.appendChild(button);
        favoriteList.appendChild(item);
    });
}

/* ========================================
   WEATHER HELPERS
======================================== */

function getWeatherText(code) {
    if (code === 0) return "Clear sky";
    if (code === 1) return "Mainly clear";
    if (code === 2) return "Partly cloudy";
    if (code === 3) return "Overcast";
    if ([45, 48].includes(code)) return "Foggy";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";

    return "Conditions unavailable";
}

function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if ([1, 2].includes(code)) return "🌤️";
    if (code === 3) return "☁️";
    if ([45, 48].includes(code)) return "🌫️";
    if ([51, 53, 55, 56, 57].includes(code)) return "🌦️";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
    if ([95, 96, 99].includes(code)) return "⛈️";

    return "🌡️";
}

async function getData(url) {
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("API request failed: " + response.status);
    }

    return response.json();
}

/* ========================================
   WIKIMEDIA CITY BACKGROUNDS
======================================== */

// Existing images for these three cities.
const cityImages = {
    jaipur:
        "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=1800&q=85",

    delhi:
        "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1800&q=85",

    mumbai:
        "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1800&q=85"
};

const backgroundCache = new Map();

function getWeatherTheme(code) {
    if ([45, 48].includes(code)) return "fog";

    if (
        [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]
            .includes(code)
    ) {
        return "rain";
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return "snow";
    }

    if ([95, 96, 99].includes(code)) {
        return "storm";
    }

    if ([2, 3].includes(code)) {
        return "cloudy";
    }

    return "clear";
}

// Search Wikimedia Commons for a city photograph.
async function getCityImage(cityName, country = "") {
    const cacheKey = `${cityName}, ${country}`.toLowerCase();

    if (backgroundCache.has(cacheKey)) {
        return backgroundCache.get(cacheKey);
    }

    const searchTerms = [
        `${cityName} ${country} skyline`,
        `${cityName} ${country} city`,
        `${cityName} ${country} landmark`
    ];

    for (const term of searchTerms) {
        try {
            const params = new URLSearchParams({
                action: "query",
                generator: "search",
                gsrsearch: term,
                gsrnamespace: "6",
                gsrlimit: "10",
                prop: "imageinfo",
                iiprop: "url",
                iiurlwidth: "1800",
                format: "json",
                origin: "*"
            });

            const response = await fetch(
                "https://commons.wikimedia.org/w/api.php?" +
                params.toString()
            );

            if (!response.ok) continue;

            const data = await response.json();
            const pages = Object.values(data.query?.pages || {});

            const suitable = pages.find(page => {
                const info = page.imageinfo?.[0];
                return info?.thumburl || info?.url;
            });

            if (!suitable) continue;

            const info = suitable.imageinfo[0];

            const result = {
                url: info.thumburl || info.url,
                title: suitable.title || "City photograph",
                sourceUrl:
                    "https://commons.wikimedia.org/wiki/" +
                    encodeURIComponent(suitable.title || "")
            };

            backgroundCache.set(cacheKey, result);
            return result;

        } catch (error) {
            console.warn("Wikimedia image search failed:", error.message);
        }
    }

    backgroundCache.set(cacheKey, null);
    return null;
}

function showImageCredit(photo) {
    let credit = document.querySelector("#city-image-credit");

    if (!photo) {
        if (credit) credit.style.display = "none";
        return;
    }

    if (!credit) {
        credit = document.createElement("a");
        credit.id = "city-image-credit";

        Object.assign(credit.style, {
            position: "fixed",
            right: "12px",
            bottom: "10px",
            zIndex: "10",
            padding: "7px 10px",
            borderRadius: "8px",
            background: "rgba(255,255,255,0.92)",
            color: "#334155",
            fontSize: "11px",
            textDecoration: "none"
        });

        document.body.appendChild(credit);
    }

    credit.href = photo.sourceUrl;
    credit.target = "_blank";
    credit.rel = "noopener noreferrer";
    credit.textContent = "Image source: Wikimedia Commons";
    credit.style.display = "inline-block";
}

async function updateDashboardBackground(
    cityName,
    weatherCode,
    country = "",
    requestId = currentRequest
) {
    const main = document.querySelector("main");
    if (!main) return;

    const theme = getWeatherTheme(weatherCode);
    const cityKey = cityName.trim().toLowerCase();

   
const overlays = {
    clear: "rgba(239, 246, 255, 0.35)",
    cloudy: "rgba(226, 232, 240, 0.42)",
    fog: "rgba(203, 213, 225, 0.48)",
    rain: "rgba(219, 234, 254, 0.38)",
    snow: "rgba(241, 245, 249, 0.45)",
    storm: "rgba(30, 41, 59, 0.48)"
};


    const gradients = {
        clear: "linear-gradient(135deg, #bfdbfe, #fef3c7)",
        cloudy: "linear-gradient(135deg, #cbd5e1, #e2e8f0)",
        fog: "linear-gradient(135deg, #cbd5e1, #f1f5f9)",
        rain: "linear-gradient(135deg, #64748b, #bfdbfe)",
        snow: "linear-gradient(135deg, #e2e8f0, #ffffff)",
        storm: "linear-gradient(135deg, #475569, #94a3b8)"
    };

    main.style.setProperty("--weather-overlay", overlays[theme]);

    // Fallback appears immediately while searching for a photo.
    main.style.setProperty(
        "--dashboard-background",
        gradients[theme]
    );

    let imageUrl = cityImages[cityKey];
    let photo = null;

    if (imageUrl) {
        showImageCredit(null);
    } else {
        photo = await getCityImage(cityName, country);

        if (requestId !== currentRequest) return;

        if (photo) {
            imageUrl = photo.url;
        }
    }

    if (!imageUrl) {
        showImageCredit(null);
        console.info("No image found. Keeping the weather gradient.");
        return;
    }

    const image = new Image();

    image.onload = function () {
        if (requestId !== currentRequest) return;

        main.style.setProperty(
            "--dashboard-background",
            `url("${imageUrl}")`
        );

        showImageCredit(photo);
    };

    image.onerror = function () {
        if (requestId !== currentRequest) return;

        showImageCredit(null);
        console.warn("Background image failed to load.");
    };

    image.src = imageUrl;
}

/* ========================================
   CITY GEOCODING
======================================== */

async function findCity(cityName) {
    const query = cityName.trim();

    // Try Open-Meteo first.
    try {
        const url =
            "https://geocoding-api.open-meteo.com/v1/search" +
            "?name=" + encodeURIComponent(query) +
            "&count=10&language=en&format=json";

        const data = await getData(url);

        if (data.results?.length) {
            const exact = data.results.find(city =>
                city.name.toLowerCase() === query.toLowerCase()
            );

            const selected = exact || data.results[0];

            return {
                name: selected.name,
                country: selected.country || "",
                latitude: Number(selected.latitude),
                longitude: Number(selected.longitude)
            };
        }
    } catch (error) {
        console.warn("Open-Meteo geocoding:", error.message);
    }

    // Fallback for locations that Open-Meteo cannot find.
    const queries = [
        query + ", Rajasthan, India",
        query + ", India"
    ];

    for (const fallbackQuery of queries) {
        try {
            const url =
                "https://nominatim.openstreetmap.org/search" +
                "?format=jsonv2&addressdetails=1&limit=5&countrycodes=in" +
                "&q=" + encodeURIComponent(fallbackQuery);

            const results = await getData(url);

            if (!Array.isArray(results) || !results.length) continue;

            const exact = results.find(item => {
                const address = item.address || {};

                const names = [
                    item.name,
                    address.city,
                    address.town,
                    address.village,
                    address.municipality,
                    address.county
                ];

                return names.some(name =>
                    name && name.trim().toLowerCase() === query.toLowerCase()
                );
            });

            const selected = exact || results[0];
            const address = selected.address || {};
            const latitude = Number(selected.lat);
            const longitude = Number(selected.lon);

            if (!Number.isFinite(latitude) ||
                !Number.isFinite(longitude)) {
                continue;
            }

            return {
                name:
                    address.city ||
                    address.town ||
                    address.village ||
                    address.municipality ||
                    selected.name ||
                    query,
                country: address.country || "India",
                latitude,
                longitude
            };
        } catch (error) {
            console.warn("Fallback geocoding:", error.message);
        }
    }

    return null;
}

/* ========================================
   AIR QUALITY LABEL
======================================== */

function getAirQualityLabel(aqi) {
    if (aqi == null || !Number.isFinite(Number(aqi))) {
        return "Unavailable";
    }

    if (aqi <= 50) return "Good";
    if (aqi <= 100) return "Moderate";
    if (aqi <= 150) return "Unhealthy for sensitive groups";
    if (aqi <= 200) return "Unhealthy";
    if (aqi <= 300) return "Very unhealthy";

    return "Hazardous";
}

/* ========================================
   WEATHER DASHBOARD
======================================== */

async function searchCity(cityName) {
    const requestId = ++currentRequest;

    if (!message || !safetyInfo || !airInfo || !forecastInfo) {
        console.error("Required dashboard elements are missing.");
        return;
    }

    message.textContent = "Loading weather for " + cityName + "...";
    safetyInfo.textContent = "Calculating...";
    airInfo.textContent = "Loading air quality...";
    forecastInfo.textContent = "Loading forecast...";

    if (temperatureInfo) temperatureInfo.textContent = "--°C";
    if (feelsLikeInfo) feelsLikeInfo.textContent = "--°C";
    if (humidityInfo) humidityInfo.textContent = "--%";
    if (windInfo) windInfo.textContent = "-- km/h";
    if (conditionInfo) conditionInfo.textContent = "Loading...";
    if (locationInfo) locationInfo.textContent = cityName;

    try {
        const place = await findCity(cityName);

        if (requestId !== currentRequest) return;

        if (!place) {
            throw new Error(
                "City not found. Check the spelling and try again."
            );
        }

        const { latitude, longitude } = place;

        const weatherUrl =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" + latitude +
            "&longitude=" + longitude +
            "&current=temperature_2m,relative_humidity_2m," +
            "apparent_temperature,weather_code,wind_speed_10m" +
            "&daily=weather_code,temperature_2m_max," +
            "temperature_2m_min,precipitation_probability_max" +
            "&forecast_days=3&timezone=auto";

        const weatherData = await getData(weatherUrl);

        if (requestId !== currentRequest) return;

        const current = weatherData.current;
        const daily = weatherData.daily;
        const code = current.weather_code;

        if (temperatureInfo) {
            temperatureInfo.textContent = current.temperature_2m + "°C";
        }

        if (feelsLikeInfo) {
            feelsLikeInfo.textContent = current.apparent_temperature + "°C";
        }

        if (humidityInfo) {
            humidityInfo.textContent = current.relative_humidity_2m + "%";
        }

        if (windInfo) {
            windInfo.textContent = current.wind_speed_10m + " km/h";
        }

        if (conditionInfo) {
            conditionInfo.textContent = getWeatherText(code);
        }

        if (locationInfo) {
            locationInfo.textContent =
                place.name + (place.country ? ", " + place.country : "");
        }

        // Load the background for the current city and weather.
        await updateDashboardBackground(
            place.name,
            code,
            place.country,
            requestId
        );

        if (requestId !== currentRequest) return;

        // Illustrative indicator, not an official safety assessment.
        let score = 100;

        if (current.temperature_2m >= 40 || current.temperature_2m <= 0) {
            score -= 30;
        } else if (current.temperature_2m >= 35) {
            score -= 15;
        }

        if (current.wind_speed_10m >= 50) {
            score -= 25;
        } else if (current.wind_speed_10m >= 30) {
            score -= 10;
        }

        safetyInfo.textContent = score + "/100 — Weather indicator";

        // Build forecast cards.
        forecastInfo.replaceChildren();

        daily.time.forEach((date, index) => {
            const item = document.createElement("div");
            item.className = "forecast-item";

            const dateObject = new Date(date + "T12:00:00");

            const heading = document.createElement("h4");
            heading.textContent = dateObject.toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short"
            });

            const icon = document.createElement("div");
            icon.className = "forecast-icon";
            icon.textContent = getWeatherIcon(daily.weather_code[index]);

            const condition = document.createElement("p");
            condition.className = "forecast-condition";
            condition.textContent = getWeatherText(daily.weather_code[index]);

            const temperature = document.createElement("p");
            temperature.className = "forecast-temperature";
            temperature.textContent =
                daily.temperature_2m_max[index] + "° / " +
                daily.temperature_2m_min[index] + "°C";

            const rain = document.createElement("p");
            rain.className = "forecast-rain";

            const chance = daily.precipitation_probability_max[index];

            rain.textContent = "💧 Rain: " +
                (chance == null ? "N/A" : chance + "%");

            item.append(heading, icon, condition, temperature, rain);
            forecastInfo.appendChild(item);
        });

        // Request air quality separately.
        try {
            const airUrl =
                "https://air-quality-api.open-meteo.com/v1/air-quality" +
                "?latitude=" + latitude +
                "&longitude=" + longitude +
                "&current=us_aqi,pm2_5,pm10&timezone=auto";

            const airData = await getData(airUrl);

            if (requestId !== currentRequest) return;

            const air = airData.current;
            const aqi = air.us_aqi;

            airInfo.replaceChildren();

            const lines = [
                ["US AQI", aqi ?? "Unavailable"],
                ["Air quality", getAirQualityLabel(aqi)],
                ["PM2.5", air.pm2_5 == null ? "Unavailable" : air.pm2_5 + " µg/m³"],
                ["PM10", air.pm10 == null ? "Unavailable" : air.pm10 + " µg/m³"]
            ];

            lines.forEach(([label, value]) => {
                const p = document.createElement("p");
                const strong = document.createElement("strong");

                strong.textContent = label + ": ";

                p.append(
                    strong,
                    document.createTextNode(String(value))
                );

                airInfo.appendChild(p);
            });

        } catch (error) {
            if (requestId !== currentRequest) return;

            airInfo.textContent =
                "Air quality data is currently unavailable.";
        }

        message.textContent =
            "Weather updated for " + place.name + ", " + place.country + ".";

    } catch (error) {
        if (requestId !== currentRequest) return;

        message.textContent =
            error.message || "Unable to load data. Please try again.";

        if (temperatureInfo) temperatureInfo.textContent = "--°C";
        if (feelsLikeInfo) feelsLikeInfo.textContent = "--°C";
        if (humidityInfo) humidityInfo.textContent = "--%";
        if (windInfo) windInfo.textContent = "-- km/h";
        if (conditionInfo) conditionInfo.textContent = "Unavailable";
        if (locationInfo) locationInfo.textContent = "City unavailable";

        safetyInfo.textContent = "Weather data unavailable.";
        airInfo.textContent = "Air quality unavailable.";
        forecastInfo.textContent = "Forecast unavailable.";

        console.error("NEXUS error:", error);
    }
}

/* ========================================
   CITY SEARCH
======================================== */

if (cityForm && cityInput) {
    cityForm.addEventListener("submit", event => {
        event.preventDefault();

        const city = cityInput.value.trim();

        if (!city) {
            message.textContent = "Please enter a city name.";
            cityInput.focus();
            return;
        }

        searchCity(city);
    });
}

/* ========================================
   ADD FAVORITE
======================================== */

if (addFavorite && favoriteCity) {
    addFavorite.addEventListener("click", () => {
        const city = favoriteCity.value.trim();

        if (!city) {
            favoriteCity.focus();
            return;
        }

        const exists = favoriteCities.some(
            saved => saved.toLowerCase() === city.toLowerCase()
        );

        if (exists) {
            message.textContent =
                "This city is already in your favorites.";
            return;
        }

        favoriteCities.push(city);
        saveFavorites();
        showFavorites();

        favoriteCity.value = "";
        message.textContent = city + " added to favorites.";
    });

    favoriteCity.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            addFavorite.click();
        }
    });
}

/* ========================================
   INITIALIZE
======================================== */

showFavorites();

if (cityInput) {
    cityInput.value = "Jaipur";
    searchCity("Jaipur");
}



const citySuggestions = document.getElementById("city-suggestions");
const citySearchInput = document.getElementById("city-search");

let suggestionTimer;
let suggestionController;

function hideCitySuggestions() {
    if (!citySuggestions) return;

    citySuggestions.classList.remove("show");
    citySuggestions.replaceChildren();
}

function showSuggestionMessage(message) {
    if (!citySuggestions) return;

    const item = document.createElement("div");
    item.className = "city-suggestions-message";
    item.textContent = message;

    citySuggestions.replaceChildren(item);
    citySuggestions.classList.add("show");
}

async function fetchCitySuggestions(query) {
    if (!citySuggestions || query.length < 2) {
        hideCitySuggestions();
        return;
    }

    if (suggestionController) {
        suggestionController.abort();
    }

    suggestionController = new AbortController();
    const controller = suggestionController;

    showSuggestionMessage("Searching cities...");

    try {
        const params = new URLSearchParams({
            name: query,
            count: "7",
            language: "en",
            format: "json"
        });

        const response = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?${params}`,
            { signal: controller.signal }
        );

        if (!response.ok) {
            throw new Error("City search failed");
        }

        const data = await response.json();

        if (controller !== suggestionController) return;

        const cities = data.results || [];

        if (cities.length === 0) {
            showSuggestionMessage("No matching cities found.");
            return;
        }

        citySuggestions.replaceChildren();

        cities.forEach(city => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = "city-suggestion";

            const name = document.createElement("span");
            name.className = "city-suggestion-name";
            name.textContent = city.name;

            const location = document.createElement("span");
            location.className = "city-suggestion-location";

            location.textContent = [
                city.admin1,
                city.country
            ].filter(Boolean).join(", ");

            button.append(name, location);

            button.addEventListener("click", () => {
                citySearchInput.value = city.name;
                hideCitySuggestions();
                searchCity(city.name);
            });

            citySuggestions.appendChild(button);
        });

        citySuggestions.classList.add("show");

    } catch (error) {
        if (error.name === "AbortError") return;

        if (controller !== suggestionController) return;

        showSuggestionMessage(
            "Suggestions unavailable. You can still search manually."
        );
    }
}

if (citySearchInput && citySuggestions) {
    citySearchInput.addEventListener("input", () => {
        clearTimeout(suggestionTimer);

        const query = citySearchInput.value.trim();

        if (suggestionController) {
            suggestionController.abort();
        }

        if (query.length < 2) {
            hideCitySuggestions();
            return;
        }

        suggestionTimer = setTimeout(() => {
            fetchCitySuggestions(query);
        }, 300);
    });

    document.addEventListener("click", event => {
        if (
            !citySuggestions.contains(event.target) &&
            event.target !== citySearchInput
        ) {
            hideCitySuggestions();
        }
    });

    citySearchInput.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            hideCitySuggestions();
        }
    });
}
