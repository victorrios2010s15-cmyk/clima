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
            showCustomModal("Localidad no encontrada. Especifique estado o región.");
            setLoadingState(false);
            return;
        }

        const venezuelaResult = data.results.find(res => res.country_code === 'VE');

        if (!venezuelaResult) {
            showCustomModal("La región solicitada no coincide con el filtrado nacional de Venezuela.");
            setLoadingState(false);
            return;
        }
        
        const displayName = `${venezuelaResult.name}, ${venezuelaResult.admin1 || venezuelaResult.country}`;
        document.getElementById('geoBadge').innerText = "CONEXIÓN REMOTA";
        fetchWeatherData(venezuelaResult.latitude, venezuelaResult.longitude, displayName);

    } catch (error) {
        showCustomModal("Fallo en la resolución de telemetría. Verifique el enlace de datos de mapas.");
        setLoadingState(false);
    }
}
