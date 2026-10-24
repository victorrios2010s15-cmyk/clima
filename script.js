const weatherCodes = {
    0: { txt: "Cielo Despejado", cls: "weather-clear" },
    1: { txt: "Mayormente Despejado", cls: "weather-clear" },
    2: { txt: "Parcialmente Nublado", cls: "weather-clouds" },
    3: { txt: "Nublado", cls: "weather-clouds" },
    45: { txt: "Niebla Atmosférica", cls: "weather-fog" },
    48: { txt: "Niebla Depositante", cls: "weather-fog" },
    51: { txt: "Llovizna Ligera", cls: "weather-rain" },
    53: { txt: "Llovizna Moderada", cls: "weather-rain" },
    55: { txt: "Llovizna Intensa", cls: "weather-rain" },
    61: { txt: "Precipitación Ligera", cls: "weather-rain" },
    63: { txt: "Lluvia Moderada", cls: "weather-rain" },
    65: { txt: "Lluvia Torrencial", cls: "weather-rain" },
    71: { txt: "Nevada Ligera", cls: "weather-clouds" },
    73: { txt: "Nevada Moderada", cls: "weather-clouds" },
    75: { txt: "Nevada Intensa", cls: "weather-clouds" },
    80: { txt: "Chubascos Ligeros", cls: "weather-rain" },
    81: { txt: "Chubascos Moderados", cls: "weather-rain" },
    82: { txt: "Chubascos Fuertes", cls: "weather-rain" },
    95: { txt: "Tormenta Eléctrica", cls: "weather-storm" }
};

window.addEventListener('load', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                fetchWeatherData(position.coords.latitude, position.coords.longitude, "Ubicación Local por GPS");
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

document.getElementById('modalBtn').addEventListener('click', () => {
    document.getElementById('customModal').classList.remove('active');
});

function showCustomModal(text) {
    document.getElementById('modalMessage').innerText = text.toUpperCase();
    document.getElementById('customModal').classList.add('active');
}

async function performSearch() {
    const query = document.getElementById('cityInput').value.trim();
    if (!query) return;

    setLoadingState(true);
    const geocodeUrl = `https://open-meteo.com{encodeURIComponent(query)}&count=10&language=es&format=json`;

    try {
        const response = await fetch(geocodeUrl);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            showCustomModal("Localidad no encontrada en los servidores cartográficos.");
            setLoadingState(false);
            return;
        }

        const venezuelaResult = data.results.find(res => res.country_code === 'VE');

        if (!venezuelaResult) {
            showCustomModal("La región ingresada está fuera del filtrado nacional.");
            setLoadingState(false);
            return;
        }
        
        const displayName = `${venezuelaResult.name}, ${venezuelaResult.admin1 || venezuelaResult.country}`;
        document.getElementById('geoBadge').innerText = "CONEXIÓN REMOTA";
        fetchWeatherData(venezuelaResult.latitude, venezuelaResult.longitude, displayName);
        document.getElementById('cityInput').value = '';

    } catch (error) {
        showCustomModal("Error en la conexión con el servidor de mapas.");
        setLoadingState(false);
    }
}

async function fetchWeatherData(lat, lon, label) {
    setLoadingState(true);
    const url = `https://open-meteo.com{lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,pressure_msl,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=7`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error();
        const data = await response.json();
        renderWeather(data, label);
    } catch (error) {
        document.getElementById('weatherCondition').innerText = "ERROR SATELITAL";
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

function updateAppBackground(code, isDay) {
    const body = document.getElementById('appBody');
    body.className = ''; 
    const config = weatherCodes[code] || { cls: "weather-clear" };
    const suffix = isDay === 1 ? "-day" : "-night";
    body.classList.add(`${config.cls}${suffix}`);
}

function renderWeather(data, label) {
    document.getElementById('locationName').innerText = label.toUpperCase();
    document.getElementById('currentTemp').innerText = `${Math.round(data.current.temperature_2m)}°`;
    
    const code = data.current.weather_code;
    const isDay = data.current.is_day;
    const config = weatherCodes[code] || { txt: "Desconocido", cls: "weather-clear" };
    document.getElementById('weatherCondition').innerText = config.txt.toUpperCase();

    updateAppBackground(code, isDay);

    document.getElementById('valHumidity').innerText = `${data.current.relative_humidity_2m}%`;
    document.getElementById('valWind').innerText = `${data.current.wind_speed_10m} km/h`;
    document.getElementById('valPressure').innerText = `${Math.round(data.current.pressure_msl)} hPa`;
    document.getElementById('valApparent').innerText = `${Math.round(data.current.apparent_temperature)}°C`;

    const sunriseTime = data.daily.sunrise[0].split('T')[1] || "--:--";
    const sunsetTime = data.daily.sunset[0].split('T')[1] || "--:--";
    document.getElementById('valSunrise').innerText = sunriseTime;
    document.getElementById('valSunset').innerText = sunsetTime;

    const hourlyContainer = document.getElementById('hourlyContainer');
    hourlyContainer.innerHTML = '';
    
    const currentHour = new Date().getHours();
    
    for (let i = 0; i < 24; i++) {
        if (!data.hourly.time[i]) break;
        
        const hourStr = data.hourly.time[i].split('T')[1] || "--:--";
        const temp = Math.round(data.hourly.temperature_2m[i]);
        const hCode = data.hourly.weather_code[i];
        const hConfig = weatherCodes[hCode] || { txt: "---" };

        const item = document.createElement('div');
        item.className = 'hourly-item';
        item.innerHTML = `
            <div style="font-size:0.75rem; color:var(--text-muted-dark); font-weight:700;">${hourStr}</div>
            <div style="margin: 0.4rem 0; font-size:0.65rem; font-weight:800; height:24px; overflow:hidden;">${hConfig.txt.toUpperCase()}</div>
            <div style="font-size:1.1rem; font-weight:600;">${temp}°</div>
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
        const dConfig = weatherCodes[dCode] || { txt: "---" };

        const item = document.createElement('div');
        item.className = 'weekly-item';
        item.innerHTML = `
            <div class="weekly-day">${dayName}</div>
            <div style="font-size:0.65rem; color:var(--text-muted-dark); height:32px; overflow:hidden; margin-bottom:0.75rem; font-weight:700;">${dConfig.txt.toUpperCase()}</div>
            <div class="weekly-temp">${maxTemp}° / <span style="opacity:0.6; font-weight:300;">${minTemp}°</span></div>
        `;
        weeklyContainer.appendChild(item);
    }
}
