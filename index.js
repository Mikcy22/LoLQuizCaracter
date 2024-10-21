const API_KEY = 'RGAPI-43faf63f-4921-4083-a6dd-5583cf4ca4b1'; //API key
const REGION = 'euw1'; // Región de EUW
const DDragonBaseURL = 'https://ddragon.leagueoflegends.com/cdn';
const patchVersion = '13.19.1'; // Versión del juego

// Obtener la lista de campeones
async function getChampionList() {
    const response = await fetch(`https://${REGION}.api.riotgames.com/lol/platform/v3/champion-rotations?api_key=${API_KEY}`);
    const data = await response.json();

    const championData = await fetch(`${DDragonBaseURL}/${patchVersion}/data/en_US/champion.json`);
    const champions = await championData.json();
    return Object.keys(champions.data);
}

// Obtener las skins de un campeón específico
async function getChampionSkins(champion) {
    const championData = await fetch(`${DDragonBaseURL}/${patchVersion}/data/en_US/champion/${champion}.json`);
    const championInfo = await championData.json();

    // Filtrar la skin "default" (por defecto) de la lista
    return championInfo.data[champion].skins.filter(skin => skin.name.toLowerCase() !== 'default');
}

// Obtener todas las skins de todos los campeones, filtrando duplicados
async function getAllSkins() {
    const championList = await getChampionList();
    const allSkins = new Map(); // Usamos un Map para evitar duplicados

    for (const champion of championList) {
        const skins = await getChampionSkins(champion);
        skins.forEach(skin => {
            // Solo agregamos la skin si el nombre no ha sido agregado antes
            if (!allSkins.has(skin.name)) {
                allSkins.set(skin.name, { skinName: skin.name, champion, skinNum: skin.num });
            }
        });
    }

    // Convertir el Map en un array
    return Array.from(allSkins.values());
}

// Seleccionar una skin aleatoria de todas las skins
async function getRandomSkin() {
    const allSkins = await getAllSkins();

    const randomSkin = allSkins[Math.floor(Math.random() * allSkins.length)];

    const splashArtUrl = `${DDragonBaseURL}/img/champion/splash/${randomSkin.champion}_${randomSkin.skinNum}.jpg`;

    return { splashArtUrl, skinName: randomSkin.skinName, champion: randomSkin.champion, allSkins };
}

// Mostrar solo una parte del splash art, centrando la imagen
function displaySplashArtFragment(splashArtUrl) {
    const container = document.getElementById("splash-art-container");

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    const splashImageWidth = 1215;
    const splashImageHeight = 717;

    const maxX = splashImageWidth - containerWidth;
    const maxY = splashImageHeight - containerHeight;

    const randomX = Math.floor(Math.random() * maxX);
    const randomY = Math.floor(Math.random() * maxY);

    container.style.backgroundImage = `url(${splashArtUrl})`;
    container.style.backgroundPosition = `-${randomX}px -${randomY}px`;
    container.style.backgroundSize = `${splashImageWidth}px ${splashImageHeight}px`;
}

// Crear el quiz con un buscador en vez de un select
async function createQuiz() {
    const { splashArtUrl, skinName, allSkins } = await getRandomSkin();

    displaySplashArtFragment(splashArtUrl);

    const searchInput = document.getElementById("skin-search");
    const suggestionsContainer = document.getElementById("suggestions");
    const errorList = document.getElementById("error-list");

    // Cuando el usuario escribe, mostrar sugerencias en el dropdown
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();

        suggestionsContainer.innerHTML = ''; // Limpiar las sugerencias previas

        // Filtrar las skins basadas en el texto ingresado
        const filteredSkins = allSkins.filter(skin => skin.skinName.toLowerCase().includes(query));

        // Mostrar sugerencias en el dropdown
        filteredSkins.forEach(skin => {
            const suggestionItem = document.createElement("li");
            suggestionItem.classList.add("list-group-item", "list-group-item-action"); // Bootstrap classes
            suggestionItem.innerText = skin.skinName;

            // Cuando el usuario selecciona una sugerencia, se autocompleta el input
            suggestionItem.addEventListener("click", () => {
                searchInput.value = skin.skinName;
                suggestionsContainer.innerHTML = ''; // Limpiar sugerencias al hacer clic
            });

            suggestionsContainer.appendChild(suggestionItem);
        });

        // Mostrar/ocultar el dropdown basado en las sugerencias disponibles
        suggestionsContainer.style.display = filteredSkins.length ? 'block' : 'none';
    });

    document.getElementById("check-answer").addEventListener("click", () => {
        const selectedOption = searchInput.value;
        const result = document.getElementById("result");

        if (selectedOption === skinName) {
            result.innerText = "¡Correcto!";
            result.className = "alert alert-primary";
            result.role = "alert";
           
        } else {

            result.innerText = `Incorrecto.`;
            result.className = "alert alert-secondary";
            result.role = "alert";
           
            // Agregar la respuesta incorrecta a la lista de errores
            const errorItem = document.createElement("li");
            errorItem.classList.add("list-group-item", "text-danger"); // Bootstrap class for red color
            errorItem.innerText = selectedOption || 'Respuesta vacía';
            errorList.appendChild(errorItem);
        }
    });
}

// Ejecutar el quiz
createQuiz().catch(error => {
    console.error('Error creando el quiz:', error);
});
