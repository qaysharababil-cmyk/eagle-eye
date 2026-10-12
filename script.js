const form = document.getElementById("lookupForm");
const phoneInput = document.getElementById("phoneInput");
const clearBtn = document.getElementById("clearBtn");
const errorBox = document.getElementById("error");
const resultSection = document.getElementById("resultSection");

const STORAGE_KEY = "phoneLookupHistoryV1";
let currentNumber = "";

const countries = [
  { code: "62", name: "Indonesia" },
  { code: "60", name: "Malaysia" },
  { code: "65", name: "Singapura" },
  { code: "63", name: "Filipina" },
  { code: "66", name: "Thailand" },
  { code: "84", name: "Vietnam" },
  { code: "91", name: "India" },
  { code: "92", name: "Pakistan" },
  { code: "81", name: "Jepang" },
  { code: "82", name: "Korea Selatan" },
  { code: "86", name: "Tiongkok" },
  { code: "44", name: "Britania Raya" },
  { code: "61", name: "Australia" },
  { code: "64", name: "Selandia Baru" },
  { code: "49", name: "Jerman" },
  { code: "33", name: "Prancis" },
  { code: "39", name: "Italia" },
  { code: "34", name: "Spanyol" },
  { code: "55", name: "Brasil" },
  { code: "971", name: "Uni Emirat Arab" },
  { code: "966", name: "Arab Saudi" },
  { code: "1", name: "Amerika Serikat / Kanada dan wilayah NANP" }
];

// Detailed Indonesia area codes with coordinates
const indonesiaAreaCodes = {
  "811": { city: "Semarang", region: "Jawa Tengah", lat: -7.250445, lng: 110.406258 },
  "812": { city: "Bandung", region: "Jawa Barat", lat: -6.903540, lng: 107.615273 },
  "813": { city: "Surabaya", region: "Jawa Timur", lat: -7.257472, lng: 112.752088 },
  "814": { city: "Bandung", region: "Jawa Barat", lat: -6.903540, lng: 107.615273 },
  "815": { city: "Bekasi", region: "Jawa Barat", lat: -6.238913, lng: 106.982971 },
  "816": { city: "Yogyakarta", region: "Jawa Tengah", lat: -7.797068, lng: 110.370529 },
  "817": { city: "Malang", region: "Jawa Timur", lat: -7.983908, lng: 112.631381 },
  "818": { city: "Surabaya", region: "Jawa Timur", lat: -7.257472, lng: 112.752088 },
  "819": { city: "Jakarta", region: "DKI Jakarta", lat: -6.174465, lng: 106.829235 },
  "821": { city: "Medan", region: "Sumatra Utara", lat: 2.194810, lng: 98.669448 },
  "822": { city: "Medan", region: "Sumatra Utara", lat: 2.194810, lng: 98.669448 },
  "823": { city: "Padang", region: "Sumatra Barat", lat: -0.949110, lng: 100.418486 },
  "824": { city: "Palembang", region: "Sumatra Selatan", lat: -2.915710, lng: 104.746701 },
  "825": { city: "Pekanbaru", region: "Riau", lat: 0.527760, lng: 101.437854 },
  "826": { city: "Jambi", region: "Jambi", lat: -1.590007, lng: 103.610829 },
  "827": { city: "Bengkulu", region: "Bengkulu", lat: -3.786889, lng: 102.267578 },
  "828": { city: "Lampung", region: "Lampung", lat: -5.389555, lng: 105.267235 },
  "829": { city: "Pangkal Pinang", region: "Bangka Belitung", lat: -2.132650, lng: 106.130310 },
  "831": { city: "Pontianak", region: "Kalimantan Barat", lat: 0.015194, lng: 109.333130 },
  "832": { city: "Palangka Raya", region: "Kalimantan Tengah", lat: -1.974160, lng: 114.034822 },
  "833": { city: "Banjarmasin", region: "Kalimantan Selatan", lat: -3.326520, lng: 114.590711 },
  "834": { city: "Samarinda", region: "Kalimantan Timur", lat: 0.495310, lng: 117.141129 },
  "835": { city: "Tarakan", region: "Kalimantan Utara", lat: 3.298316, lng: 117.631367 },
  "836": { city: "Manado", region: "Sulawesi Utara", lat: 1.502443, lng: 124.842675 },
  "837": { city: "Palu", region: "Sulawesi Tengah", lat: -0.897691, lng: 119.840523 },
  "838": { city: "Makassar", region: "Sulawesi Selatan", lat: -5.135399, lng: 119.423389 },
  "839": { city: "Kendari", region: "Sulawesi Tenggara", lat: -3.963243, lng: 122.504772 },
  "851": { city: "Denpasar", region: "Bali", lat: -8.670458, lng: 115.212603 },
  "852": { city: "Kupang", region: "Nusa Tenggara Timur", lat: -10.169625, lng: 123.613953 },
  "853": { city: "Mataram", region: "Nusa Tenggara Barat", lat: -8.590067, lng: 116.127154 },
  "854": { city: "Jayapura", region: "Papua", lat: -2.491687, lng: 140.714993 },
  "855": { city: "Manokwari", region: "Papua Barat", lat: -0.866497, lng: 134.082230 },
  "856": { city: "Ambon", region: "Maluku", lat: -3.695196, lng: 128.192100 },
  "857": { city: "Ternate", region: "Maluku Utara", lat: 0.793635, lng: 127.378250 },
  "858": { city: "Gorontalo", region: "Gorontalo", lat: 0.534269, lng: 123.055392 },
  "859": { city: "Mamuju", region: "Sulawesi Barat", lat: -2.669591, lng: 118.844082 }
};

// Country center coordinates for fallback
const countryCoordinates = {
  "62": { name: "Indonesia", lat: -2.548926, lng: 113.921327 },
  "60": { name: "Malaysia", lat: 4.210484, lng: 101.686855 },
  "65": { name: "Singapura", lat: 1.352083, lng: 103.819836 },
  "63": { name: "Filipina", lat: 12.879721, lng: 121.774017 },
  "66": { name: "Thailand", lat: 15.870032, lng: 100.992541 },
  "84": { name: "Vietnam", lat: 14.058324, lng: 108.277199 },
  "91": { name: "India", lat: 20.593684, lng: 78.962880 },
  "92": { name: "Pakistan", lat: 30.375321, lng: 69.345116 },
  "1": { name: "USA", lat: 37.09024, lng: -95.71289 }
};

function getLocationCoordinates(number) {
  const country = countries
    .slice()
    .sort((a, b) => b.code.length - a.code.length)
    .find(item => number.startsWith(item.code));

  if (!country) {
    return { name: "Tidak diketahui", lat: 0, lng: 0 };
  }

  if (country.code === "62") {
    const national = number.slice(2);
    const areaCode3 = national.slice(0, 3);
    
    if (indonesiaAreaCodes[areaCode3]) {
      const loc = indonesiaAreaCodes[areaCode3];
      return { name: `${loc.city}, ${loc.region}`, lat: loc.lat, lng: loc.lng };
    }
    
    // Fallback to Indonesia center
    return { name: "Indonesia", lat: -2.548926, lng: 113.921327 };
  }

  // Use country center for other countries
  if (countryCoordinates[country.code]) {
    const coord = countryCoordinates[country.code];
    return { name: coord.name, lat: coord.lat, lng: coord.lng };
  }

  return { name: country.name, lat: 0, lng: 0 };
}

function updateMap(lat, lng, name) {
  const mapFrame = document.getElementById("mapFrame");
  if (!mapFrame) return;

  // Calculate bounding box for OSM embed
  const zoomLevel = name.includes(",") ? "11" : "5"; // More zoom for cities
  const bbox = `${lng - 0.5},${lat - 0.5},${lng + 0.5},${lat + 0.5}`;
  
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  mapFrame.src = mapUrl;
}

function estimateLocation(number) {
  const country = countries
    .slice()
    .sort((a, b) => b.code.length - a.code.length)
    .find(item => number.startsWith(item.code));

  if (!country) return "Tidak diketahui";

  if (country.code === "62") {
    const national = number.slice(2);
    const areaCode3 = national.slice(0, 3);
    
    if (indonesiaAreaCodes[areaCode3]) {
      const loc = indonesiaAreaCodes[areaCode3];
      return `${loc.city}, ${loc.region}`;
    }
    
    return "Indonesia";
  }

  if (country.code === "60") return "Malaysia";
  if (country.code === "65") return "Singapura";
  if (country.code === "63") return "Filipina";
  if (country.code === "66") return "Thailand";
  if (country.code === "84") return "Vietnam";
  if (country.code === "1") return "USA / Kanada";
  
  return country.name;
}

// Normalisasi format umum nomor telepon.
function normalizeNumber(value) {
  let number = value.trim();

  // Hanya menerima digit, spasi, tanda +, kurung, titik, dan strip.
  if (!/^[+\d\s().-]+$/.test(number)) {
    throw new Error("Gunakan angka dan simbol nomor telepon yang wajar.");
  }

  const hasPlus = number.startsWith("+");
  number = number.replace(/\D/g, "");

  if (number.startsWith("00")) {
    number = number.slice(2);
  } else if (!hasPlus && number.startsWith("0")) {
    number = "62" + number.slice(1);
  } else if (!hasPlus && number.startsWith("8")) {
    number = "62" + number;
  }

  if (number.length < 7 || number.length > 15) {
    throw new Error("Panjang nomor di luar rentang umum 7–15 digit. Periksa kembali.");
  }

  return number;
}

// Pemeriksaan pola sederhana, bukan verifikasi operator atau pemilik.
function inspectNumber(number) {
  const country = countries
    .slice()
    .sort((a, b) => b.code.length - a.code.length)
    .find(item => number.startsWith(item.code));

  let countryName = country ? country.name : "Tidak dikenali";
  let callingCode = country ? "+" + country.code : "Belum diketahui";
  let location = estimateLocation(number);
  let type = "Belum dapat dipastikan";
  let detail = "Pola umum saja";
  let plausible = true;
  let explanation =
    "Hasil berasal dari pola nomor. Ini tidak memverifikasi nomor aktif, " +
    "identitas pemilik, operator, atau lokasi GPS.";

  if (country && country.code === "62") {
    const national = number.slice(2);

    if (/^8\d{8,11}$/.test(national)) {
      type = "Kemungkinan seluler";
      detail = "Awalan 08 / +628";
    } else {
      type = "Pola belum dikenali";
      detail = "Perlu pemeriksaan lanjutan";
      plausible = false;
    }
  } else if (country && country.code === "1") {
    const national = number.slice(1);
    plausible = /^\d{10}$/.test(national);
    type = plausible ? "Kemungkinan nomor NANP" : "Pola belum dikenali";
    detail = "AS, Kanada, dan wilayah terkait";
  } else if (country) {
    type = "Nomor internasional";
    detail = "Negara berdasarkan kode panggilan";
  } else {
    type = "Kode negara belum dikenali";
    detail = "Tidak ada kecocokan pada daftar";
    plausible = false;
  }

  return {
    countryName,
    callingCode,
    location,
    type,
    detail,
    plausible,
    explanation
  };
}

function formatInternational(number) {
  return "+" + number;
}

function getHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function saveHistory(number) {
  const history = getHistory().filter(item => item.number !== number);

  history.unshift({
    number,
    time: new Date().toISOString()
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, 5)));
  } catch {
    // Website tetap berfungsi jika penyimpanan browser tidak tersedia.
  }

  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("historyList");
  const history = getHistory();

  list.replaceChildren();

  if (history.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";

    const icon = document.createElement("span");
    icon.textContent = "◷";

    const message = document.createElement("p");
    message.textContent = "Belum ada pencarian.";

    empty.append(icon, message);
    list.append(empty);
    return;
  }

  history.forEach(item => {
    const row = document.createElement("div");
    row.className = "history-item";

    const icon = document.createElement("span");
    icon.textContent = "☎";

    const details = document.createElement("div");
    details.className = "history-number";

    const number = document.createElement("strong");
    number.textContent = formatInternational(item.number);

    const time = document.createElement("small");
    const date = new Date(item.time);
    time.textContent = Number.isNaN(date.getTime())
      ? "Pencarian sebelumnya"
      : date.toLocaleString("id-ID");

    details.append(number, time);

    const open = document.createElement("button");
    open.className = "history-open";
    open.type = "button";
    open.textContent = "Lihat";
    open.addEventListener("click", () => {
      phoneInput.value = formatInternational(item.number);
      form.requestSubmit();
    });

    row.append(icon, details, open);
    list.append(row);
  });
}

function showError(message) {
  errorBox.textContent = message;
}

form.addEventListener("submit", event => {
  event.preventDefault();
  showError("");

  let number;

  try {
    number = normalizeNumber(phoneInput.value);
  } catch (error) {
    resultSection.classList.add("hidden");
    showError(error.message);
    return;
  }

  const result = inspectNumber(number);
  const locationCoord = getLocationCoordinates(number);
  currentNumber = number;

  document.getElementById("formattedNumber").textContent =
    formatInternational(number);

  document.getElementById("validity").textContent = result.plausible
    ? "✓ Format tampak masuk akal"
    : "ⓘ Format belum dapat dipastikan";

  document.getElementById("country").textContent = result.countryName;
  document.getElementById("callingCode").textContent =
    "Kode panggilan: " + result.callingCode;
  
  const locationEl = document.getElementById("location");
  if (locationEl) {
    locationEl.textContent = result.location;
  }

  document.getElementById("numberType").textContent = result.type;
  document.getElementById("numberTypeDetail").textContent = result.detail;
  document.getElementById("explanation").textContent = result.explanation;

  // Update map
  updateMap(locationCoord.lat, locationCoord.lng, locationCoord.name);

  resultSection.classList.remove("hidden");
  saveHistory(number);

  resultSection.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

clearBtn.addEventListener("click", () => {
  phoneInput.value = "";
  showError("");
  phoneInput.focus();
});

document.getElementById("copyBtn").addEventListener("click", async () => {
  if (!currentNumber) return;

  try {
    await navigator.clipboard.writeText(formatInternational(currentNumber));
    document.getElementById("copyBtn").textContent = "✓";
  } catch {
    showError("Gagal menyalin. Silakan salin nomor secara manual.");
  }
});

document.getElementById("whatsappBtn").addEventListener("click", () => {
  if (!currentNumber) return;

  window.open(
    "https://wa.me/" + encodeURIComponent(currentNumber),
    "_blank",
    "noopener,noreferrer"
  );
});

document.getElementById("clearHistoryBtn").addEventListener("click", () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Abaikan jika penyimpanan tidak tersedia.
  }

  renderHistory();
});

renderHistory();
