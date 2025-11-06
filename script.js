let recognition;
let finalText = "";
let selectedVoice = null;

const transcriptBox = document.getElementById("transcript");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const statusText = document.getElementById("status");
const modeSelect = document.getElementById("modeSelect");
const speakBtn = document.getElementById("speakBtn");
const saveBtn = document.getElementById("saveBtn");
const voiceSelect = document.getElementById("voiceSelect");

function changeMode() {
  const mode = modeSelect.value;
  if (mode === "audioToLyrics" || mode === "hindiToEnglish") {
    startBtn.style.display = "inline-block";
    stopBtn.style.display = "inline-block";
    speakBtn.style.display = "none";
    voiceSelect.style.display = "none";
    saveBtn.style.display = "inline-block";
  } else if (mode === "lyricsToAudio") {
    startBtn.style.display = "none";
    stopBtn.style.display = "none";
    speakBtn.style.display = "inline-block";
    voiceSelect.style.display = "inline-block";
    saveBtn.style.display = "none"; // hide save in this mode
    loadVoices();
  }
}

if ('webkitSpeechRecognition' in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onstart = () => {
    statusText.textContent = "🎙️ Listening...";
    startBtn.disabled = true;
    stopBtn.disabled = false;
    finalText = transcriptBox.value;
  };

  recognition.onend = () => {
    statusText.textContent = "Not Listening";
    startBtn.disabled = false;
    stopBtn.disabled = true;
  };

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      let text = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        if (modeSelect.value === "hindiToEnglish") {
          translateHindiToEnglish(text);
        } else {
          finalText += text + " ";
          transcriptBox.value = finalText;
        }
      } else {
        interim += text;
        if (modeSelect.value !== "hindiToEnglish") {
          transcriptBox.value = finalText + interim;
        }
      }
    }
  };

  startBtn.onclick = () => {
    recognition.lang = modeSelect.value === "hindiToEnglish" ? "hi-IN" : "en-US";
    recognition.start();
  };

  stopBtn.onclick = () => recognition.stop();
}

function speakLyrics() {
  const text = transcriptBox.value;
  if (!text.trim()) return alert("Enter lyrics first!");
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.voice = selectedVoice;
  speechSynthesis.speak(utter);
}

async function translateHindiToEnglish(text) {
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=hi&tl=en&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    const translated = data[0].map(part => part[0]).join('');
    finalText += translated + " ";
    transcriptBox.value = finalText;
  } catch {
    transcriptBox.value = "Translation failed!";
  }
}

async function saveToLocal() {
  const { jsPDF } = window.jspdf;
  const text = transcriptBox.value.trim();
  const name = document.getElementById("filename").value.trim() || "Untitled";

  if (!text) return alert("Nothing to save!");

  const doc = new jsPDF();
  const lines = doc.splitTextToSize(text, 180);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text(lines, 15, 20);
  doc.save(`${name}.pdf`);

  alert("✅ Lyrics saved as PDF: " + name + ".pdf");
}

function loadVoices() {
  const voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = '';
  voices.filter(v => v.lang.startsWith("en")).forEach((v, i) => {
    const option = document.createElement("option");
    option.value = i;
    option.textContent = `${v.name} (${v.lang})`;
    voiceSelect.appendChild(option);
  });
  voiceSelect.onchange = () => {
    const index = voiceSelect.value;
    selectedVoice = speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"))[index];
  };
  const englishVoices = speechSynthesis.getVoices().filter(v => v.lang.startsWith("en"));
  if (englishVoices.length > 0) selectedVoice = englishVoices[0];
}

speechSynthesis.onvoiceschanged = loadVoices;
window.onload = () => { changeMode(); loadVoices(); };
