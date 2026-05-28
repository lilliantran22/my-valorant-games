// Map name to image file mapping
const MAP_IMAGES = {
    "Abyss": "Loading_Screen_Abyss.webp",
    "Ascent": "Loading_Screen_Ascent.webp",
    "Bind": "Loading_Screen_Bind.webp",
    "Breeze": "Loading_Screen_Breeze.webp",
    "Corrode": "Loading_Screen_Corrode.webp",
    "Fracture": "Loading_Screen_Fracture.webp",
    "Haven": "Loading_Screen_Haven.webp",
    "Icebox": "Loading_Screen_Icebox.webp",
    "Lotus": "Loading_Screen_Lotus.webp",
    "Pearl": "Loading_Screen_Pearl.webp",
    "Split": "Loading_Screen_Split.webp",
    "Sunset": "Loading_Screen_Sunset.webp"
};

// Base path for map images
const MAP_IMG_BASE = "../../images/valorant/maps/";

function getMapImageUrl(mapName) {
    const fileName = MAP_IMAGES[mapName];
    if (fileName) {
        return `${MAP_IMG_BASE}${fileName}`;
    }
    return null;
}