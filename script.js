const weatherCodes = {
    0: "Cielo Despejado", 1: "Mayormente Despejado", 2: "Parcialmente Nublado", 3: "Nublado",
    45: "Presencia de Niebla", 48: "Niebla Depositante", 51: "Llovizna Ligera", 53: "Llovizna Moderada",
    55: "Llovizna Intensa", 61: "Lluvia Ligera", 63: "Lluvia Moderada", 65: "Precipitaciones Fuertes",
    71: "Nevada Ligera", 73: "Nevada Moderada", 75: "Nevada Intensa", 80: "Chubascos Dispersos",
    81: "Chubascos Moderados", 82: "Chubascos Torrenciales", 95: "Tormenta Eléctrica"
};

window.addEventListener('load', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeatherData(position.coords.latitude, position.coords.longitude, "Tu Ubicación Actual");
            },
            () => {
                fetchWeatherData(10.488, -66.879, "Caracas, DF");
            }
        );
    } else {
        fetchWeatherData(10.488, -66.879, "Caracas, DF");
    }
});

document.getElementById('searchBtn').addEventListener('click', performSearch);
document.getElementById('cityInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

async function performSearch() {
    const query = document.getElementById('cityInput').value.trim();
    if (!query) return;

    setLoadingState(true);
    const geocodeUrl = `https://open-meteo.com{encodeURIComponent(query)}&count=5&language=es&format=json`;

    try {
        const response = await fetch(geocodeUrl);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            alert("Localidad no encontrada. Intente especificando más, ej: 'San Joaquin, Carabobo'.");
            setLoadingState(false);
            return;
        }

        const venezuelaResult = data.results.find(res => res.country_code === 'VE') || data.results[0];
        
        const displayName = `${venezuelaResult.name}, ${venezuelaResult.admin1 || venezuelaResult.country}`;
        document.getElementById('geoBadge').innerText = "CONEXIÓN REMOTA";
        fetchWeatherData(venezuelaResult.latitude, venezuelaResult.longitude, displayName);

    } catch (error) {
        alert("Error al conectar con el servidor de mapas.");
        setLoadingState(false);
    }
}

async function fetchWeatherData(lat, lon, label) {
    setLoadingState(true);
    const url = `https://open-meteo.com{lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,pressure_msl,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Fallo en la conexión satelital");
        const data = await response.json();
        renderWeather(data, label);
    } catch (error) {
        document.getElementById('weatherCondition').innerText = "ERROR DE CONEXIÓN";
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(isLoading) {
    const cards = document.querySelectorAll('.cyber-card');
    cards.forEach(card => {
        if (isLoading) card.classList.add('loading-skeleton');
        else card.classList.remove('loading-skeleton');
    });
}

function renderWeather(data, label) {
    document.getElementById('locationName').innerText = label.toUpperCase();
    document.getElementById('currentTemp').innerText = `${Math.round(data.current.temperature_2m)}°`;
    
    const code = data.current.weather_code;
    document.getElementById('weatherCondition').innerText = (weatherCodes[code] || "Desconocido").toUpperCase();

    document.getElementById('valHumidity').innerText = `${data.current.relative_humidity_2m}%`;
    document.getElementById('valWind').innerText = `${data.current.wind_speed_10m} km/h`;
    document.getElementById('valPressure').innerText = `${Math.round(data.current.pressure_msl)} hPa`;
    document.getElementById('valApparent').innerText = `${Math.round(data.current.apparent_temperature)}°C`;

    const hourlyContainer = document.getElementById('hourlyContainer');
    hourlyContainer.innerHTML = '';
    for (let i = 0; i < 24; i++) {
        const hourStr = data.hourly.time[i].split('T')[1];
        const temp = Math.round(data.hourly.temperature_2m[i]);
        const hCode = data.hourly.weather_code[i];
        const condition = weatherCodes[hCode] || "---";

        const item = document.createElement('div');
        item.className = 'hourly-item';
        item.innerHTML = `
            <div style="font-size:0.75rem; color:var(--text-secondary); font-weight:700; letter-spacing:0.5px;">${hourStr}</div>
            <div style="margin: 0.4rem 0; font-size:0.65rem; color:var(--accent-sky); font-weight:800; height:24px; overflow:hidden; letter-spacing:0.5px;">${condition.toUpperCase()}</div>
            <div style="font-size:1.1rem; font-weight:300; color:var(--text-primary);">${temp}°</div>
        `;
        hourlyContainer.appendChild(item);
    }

    const weeklyContainer = document.getElementById('weeklyContainer');
    weeklyContainer.innerHTML = '';
    const days = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    
    for (let i = 0; i < 7; i++) {
        const dateObj = new Date(data.daily.time[i] + 'T00:00:00');
        const dayName = days[dateObj.getDay()];
        const maxTemp = Math.round(data.daily.temperature_2m_max[i]);
        const minTemp = Math.round(data.daily.temperature_2m_min[i]);
        const dCode = data.daily.weather_code[i];
        const condition = weatherCodes[dCode] || "---";

        const item = document.createElement('div');
        item.className = 'weekly-item';
        item.innerHTML = `
            <div class="weekly-day">${dayName}</div>
            <div style="font-size:0.65rem; color:var(--text-secondary); height:32px; overflow:hidden; margin-bottom:0.75rem; font-weight:700; letter-spacing:0.5px;">${condition.toUpperCase()}</div>
            <div class="weekly-temp">${maxTemp}° / <span style="color:var(--text-secondary); font-weight:300;">${minTemp}°</span></div>
        `;
        weeklyContainer.appendChild(item);
    }
}
