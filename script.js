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

// Detailed Indonesia region mapping by area code
const indonesiaAreaCodes = {
  "811": { region: "Jawa Tengah", city: "Semarang" },
  "812": { region: "Jawa Barat", city: "Bandung / Jakarta" },
  "813": { region: "Jawa Timur", city: "Surabaya" },
  "814": { region: "Jawa Barat", city: "Bandung" },
  "815": { region: "Jawa Barat", city: "Bekasi" },
  "816": { region: "Jawa Tengah", city: "Yogyakarta" },
  "817": { region: "Jawa Timur", city: "Malang" },
  "818": { region: "Jawa Timur", city: "Surabaya" },
  "819": { region: "Jawa Barat", city: "Jakarta" },
  "821": { region: "Sumatra Utara", city: "Medan" },
  "822": { region: "Sumatra Utara", city: "Medan" },
  "823": { region: "Sumatra Barat", city: "Padang" },
  "824": { region: "Sumatra Selatan", city: "Palembang" },
  "825": { region: "Riau", city: "Pekanbaru" },
  "826": { region: "Jambi", city: "Jambi" },
  "827": { region: "Bengkulu", city: "Bengkulu" },
  "828": { region: "Lampung", city: "Lampung" },
  "829": { region: "Bangka Belitung", city: "Pangkal Pinang" },
  "831": { region: "Kalimantan Barat", city: "Pontianak" },
  "832": { region: "Kalimantan Tengah", city: "Palangka Raya" },
  "833": { region: "Kalimantan Selatan", city: "Banjarmasin" },
  "834": { region: "Kalimantan Timur", city: "Samarinda" },
  "835": { region: "Kalimantan Utara", city: "Tarakan" },
  "836": { region: "Sulawesi Utara", city: "Manado" },
  "837": { region: "Sulawesi Tengah", city: "Palu" },
  "838": { region: "Sulawesi Selatan", city: "Makassar" },
  "839": { region: "Sulawesi Tenggara", city: "Kendari" },
  "851": { region: "Bali", city: "Denpasar" },
  "852": { region: "Nusa Tenggara Timur", city: "Kupang" },
  "853": { region: "Nusa Tenggara Barat", city: "Mataram" },
  "854": { region: "Papua", city: "Jayapura" },
  "855": { region: "Papua Barat", city: "Manokwari" },
  "856": { region: "Maluku", city: "Ambon" },
  "857": { region: "Maluku Utara", city: "Ternate" },
  "858": { region: "Gorontalo", city: "Gorontalo" },
  "859": { region: "Sulawesi Barat", city: "Mamuju" }
};

function estimateLocation(number) {
  const country = countries
    .slice()
    .sort((a, b) => b.code.length - a.code.length)
    .find(item => number.startsWith(item.code));

  if (!country) return "Tidak diketahui";

  if (country.code === "62") {
    const national = number.slice(2);
    const areaCode3 = national.slice(0, 3);
    const areaCode2 = national.slice(0, 2);
    
    // Try 3-digit area code first (more specific)
    if (indonesiaAreaCodes[areaCode3]) {
      const loc = indonesiaAreaCodes[areaCode3];
      return `${loc.city}, ${loc.region}`;
    }
    
    // Fallback to 2-digit area code
    const basicCode = areaCode2;
    if (basicCode === "81") return "Jawa Tengah";
    if (basicCode === "82") return "Jawa Barat / Jakarta";
    if (basicCode === "83") return "Jawa Timur";
    if (basicCode === "84") return "Sumatra Utara";
    if (basicCode === "85") return "Sumatra Barat / Riau";
    if (basicCode === "86") return "Kalimantan";
    if (basicCode === "87") return "Sulawesi";
    if (basicCode === "88") return "Papua / Maluku";
    if (basicCode === "89") return "Bali / Nusa Tenggara";
    
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
    // Konversi format lokal Indonesia, misalnya 0812... menjadi 62812...
    number = "62" + number.slice(1);
  } else if (!hasPlus && number.startsWith("8")) {
    // Memungkinkan format Indonesia tanpa angka nol di depan.
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
    // Kode negara diketahui, tetapi tipe dan validitas belum diverifikasi.
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

  // Simpan maksimal 5 pencarian terakhir.
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

  // Membuka WhatsApp dengan nomor tujuan.
  // Ini tidak memeriksa keberadaan akun atau identitas pemilik.
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
