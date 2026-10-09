/**
 * UniMate AI Voice Integration (Speech-to-Text & Text-to-Speech)
 */

let speechRecognition = null;
let isRecording = false;
let ttsEnabled = false;

// 1. Text-to-Speech (TTS)
function speakText(text) {
  if (!('speechSynthesis' in window)) return;

  // Clean markdown syntax for speech
  const cleanText = text
    .replace(/```[\s\S]*?```/g, 'Code block omitted.')
    .replace(/[#*_`~>|]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .slice(0, 350); // speak summary

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = parseFloat(localStorage.getItem('unimate_voice_rate') || '1.0');
  utterance.pitch = 1.0;
  window.speechSynthesis.speak(utterance);
}

// 2. Speech-to-Text (STT)
function initVoiceInput() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    console.warn('Speech Recognition not supported in this browser.');
    return;
  }

  speechRecognition = new SpeechRec();
  speechRecognition.continuous = false;
  speechRecognition.interimResults = false;
  speechRecognition.lang = 'en-US';

  const micBtn = document.getElementById('micBtn');
  const messageInput = document.getElementById('messageInput');

  speechRecognition.onstart = () => {
    isRecording = true;
    micBtn.classList.add('mic-recording');
  };

  speechRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    if (transcript && messageInput) {
      messageInput.value = (messageInput.value ? messageInput.value + ' ' : '') + transcript;
      messageInput.focus();
    }
  };

  speechRecognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    isRecording = false;
    micBtn.classList.remove('mic-recording');
  };

  speechRecognition.onend = () => {
    isRecording = false;
    micBtn.classList.remove('mic-recording');
  };

  micBtn.addEventListener('click', () => {
    if (!speechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }
    if (isRecording) {
      speechRecognition.stop();
    } else {
      speechRecognition.start();
    }
  });
}

// TTS toggle button
document.addEventListener('DOMContentLoaded', () => {
  const ttsBtn = document.getElementById('ttsToggleBtn');
  if (ttsBtn) {
    ttsBtn.addEventListener('click', () => {
      ttsEnabled = !ttsEnabled;
      if (ttsEnabled) {
        ttsBtn.classList.add('text-indigo-400');
        ttsBtn.classList.remove('text-gray-400');
        speakText('Voice output enabled.');
      } else {
        ttsBtn.classList.remove('text-indigo-400');
        ttsBtn.classList.add('text-gray-400');
        window.speechSynthesis.cancel();
      }
    });
  }

  initVoiceInput();
});
