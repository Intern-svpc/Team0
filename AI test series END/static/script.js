/******************
 * Global Variables & Configurations
 ******************/
let stream = null;                    // Media stream for webcam/audio
let overallTranscript = "";           // Accumulates user's spoken transcript (if needed)
let transcriptData = [];              // Stores Q&A pairs: { question, answer }
let currentQuestionText = "";         // Holds current question text
let currentAnswer = "";               // Holds current answer for the active question
let recognition;                      // SpeechRecognition instance
let introduction = null;              // Holds the introduction dialog from DB
let questions = [];                   // Holds the question dialogs from DB
let currentQuestionIndex = 0;         // Index of current question

// Countdown globals for pausing/resuming
let countdownInterval = null;
let countdownRemaining = 0;
let currentCountdownCallback = null;

// User settings for speech synthesis (modifiable via Settings Modal)
let userSettings = {
  speechRate: 1,
  volume: 1
};

/******************
 * DOM Element References
 ******************/
const userWebcam       = document.getElementById('userWebcam');
const errorMessageDiv  = document.getElementById('errorMessage');
const muteButton       = document.getElementById('muteButton');
const webcamButton     = document.getElementById('webcamButton');
const endInterviewBtn  = document.getElementById('endInterviewButton');
const settingsButton   = document.getElementById('settingsButton');
const questionTextDiv  = document.getElementById('questionText');
const timerDiv         = document.getElementById('timer');
const aiAvatar         = document.getElementById('aiAvatar');
const avatarImage      = document.getElementById('avatarImage');
const startInterviewBtn= document.getElementById('startInterview');
const downloadModal    = document.getElementById('downloadModal');
const downloadBtn      = document.getElementById('downloadBtn');
const settingsModal    = document.getElementById('settingsModal');
const settingsForm     = document.getElementById('settingsForm');
const closeSettingsBtn = document.getElementById('closeSettings');
const confirmEndModal  = document.getElementById('confirmEndModal');
const confirmEndBtn    = document.getElementById('confirmEndBtn');
const goBackBtn        = document.getElementById('goBackBtn');

/******************
 * Initialization Functions
 ******************/

// Initialize webcam: request video and audio, then disable both by default.
async function initWebcam() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    // Disable both audio and video tracks initially.
    stream.getAudioTracks().forEach(track => track.enabled = false);
    stream.getVideoTracks().forEach(track => track.enabled = false);
    userWebcam.srcObject = stream;
  } catch (err) {
    console.error("Error accessing webcam:", err);
    displayError("Unable to access webcam. Please check your permissions.");
  }
}
initWebcam();

// Initialize Speech Recognition if available.
function initSpeechRecognition() {
  if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;  // Capture continuously while mic is on
    recognition.interimResults = false; // Use only final results
    recognition.lang = 'en-US';

    recognition.onresult = function(event) {
      let answerPart = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          answerPart += event.results[i][0].transcript + " ";
        }
      }
      // If a question is active, append to currentAnswer; otherwise, append to overallTranscript.
      if (currentQuestionText !== "") {
        currentAnswer += answerPart;
      } else {
        overallTranscript += answerPart;
      }
    };

    recognition.onerror = function(event) {
      console.error("Speech recognition error:", event.error);
    };
  }
}
initSpeechRecognition();

/******************
 * Utility Functions
 ******************/

// Display an error message.
function displayError(message) {
  if (errorMessageDiv) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';
  } else {
    alert(message);
  }
}

// Update button icon based on the specified action.
function updateButton(button, action) {
  console.log("Updating button icon to:", action);
  if (action === 'mute') {
    button.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
    button.classList.remove("btn-on");
    button.classList.add("btn-off");
  } else if (action === 'unmute') {
    button.innerHTML = '<i class="fa-solid fa-microphone"></i>';
    button.classList.remove("btn-off");
    button.classList.add("btn-on");
  } else if (action === 'videoOff') {
    button.innerHTML = '<i class="fa-solid fa-video-slash"></i>';
    button.classList.remove("btn-on");
    button.classList.add("btn-off");
  } else if (action === 'videoOn') {
    button.innerHTML = '<i class="fa-solid fa-video"></i>';
    button.classList.remove("btn-off");
    button.classList.add("btn-on");
  }
}

// Start a countdown timer; store the remaining seconds and callback.
function startCountdown(seconds, callback) {
  countdownRemaining = seconds;
  currentCountdownCallback = callback;
  timerDiv.style.display = 'block';
  timerDiv.textContent = countdownRemaining;
  countdownInterval = setInterval(() => {
    countdownRemaining--;
    timerDiv.textContent = countdownRemaining;
    if (countdownRemaining <= 0) {
      clearInterval(countdownInterval);
      timerDiv.style.display = 'none';
      if (callback) callback();
    }
  }, 1000);
}

// Pause the current countdown.
function pauseCountdown() {
  clearInterval(countdownInterval);
}

// Resume the countdown with the remaining time.
function resumeCountdown() {
  if (countdownRemaining > 0 && currentCountdownCallback) {
    timerDiv.style.display = 'block';
    timerDiv.textContent = countdownRemaining;
    countdownInterval = setInterval(() => {
      countdownRemaining--;
      timerDiv.textContent = countdownRemaining;
      if (countdownRemaining <= 0) {
        clearInterval(countdownInterval);
        timerDiv.style.display = 'none';
        if (currentCountdownCallback) currentCountdownCallback();
      }
    }, 1000);
  }
}

/******************
 * Button Event Listeners
 ******************/

// Mute/Unmute mic functionality.
muteButton.addEventListener('click', function () {
  console.log("Mute button clicked.");
  if (!stream) return;
  let audioTracks = stream.getAudioTracks();
  if (audioTracks.length > 0) {
    const currentState = audioTracks[0].enabled;
    audioTracks.forEach(track => track.enabled = !currentState);
    const newState = audioTracks[0].enabled;
    console.log("Audio track new state:", newState);
    updateButton(this, newState ? 'unmute' : 'mute');

    if (newState) {
      // Mic turned on: clear current answer and start recognition.
      currentAnswer = "";
      if (recognition) {
        console.log("Starting speech recognition...");
        recognition.start();
      }
    } else {
      if (recognition) {
        console.log("Stopping speech recognition...");
        recognition.stop();
      }
    }
  }
});

// Webcam toggle functionality.
webcamButton.addEventListener('click', async function () {
  if (!stream) return;
  let videoTracks = stream.getVideoTracks();
  if (videoTracks.length > 0) {
    const currentState = videoTracks[0].enabled;
    videoTracks.forEach(track => track.enabled = !currentState);
    updateButton(this, currentState ? 'videoOff' : 'videoOn');
  }
});

// End Interview Button: Instead of immediately ending, show confirmation modal.
endInterviewBtn.addEventListener('click', function () {
  // Pause the countdown and speech synthesis.
  pauseCountdown();
  window.speechSynthesis.pause();
  // Show confirmation modal.
  confirmEndModal.style.display = 'block';
});

// Confirmation modal: If user confirms ending the interview.
confirmEndBtn.addEventListener('click', function () {
  // Stop all media and recognition.
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  if (recognition) {
    recognition.stop();
  }
  // Hide confirmation modal.
  confirmEndModal.style.display = 'none';
  // Proceed to show download modal.
  showDownloadModal();
});

// Confirmation modal: If user clicks "Go Back", resume the interview.
goBackBtn.addEventListener('click', function () {
  // Hide confirmation modal.
  confirmEndModal.style.display = 'none';
  // Resume speech synthesis.
  window.speechSynthesis.resume();
  // Resume the countdown.
  resumeCountdown();
});

// Settings modal toggle.
settingsButton.addEventListener('click', function () {
  toggleSettingsModal();
});

/******************
 * Transcript Saving Functionality
 ******************/
function saveTranscript(text) {
  fetch('/save_transcript', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript: text })
  })
    .then(response => response.json())
    .then(data => console.log("Transcript saved:", data))
    .catch(error => console.error("Error saving transcript:", error));
}

/******************
 * PDF Generation & Download Modal
 ******************/
function showDownloadModal() {
  downloadModal.style.display = 'block';
}

downloadBtn.addEventListener('click', function () {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let yPos = 20;

  doc.setFont("times");
  doc.setFontSize(16);
  doc.text("Interview Transcript", 105, yPos, { align: "center" });
  yPos += 10;
  doc.setFontSize(12);

  transcriptData.forEach(pair => {
    doc.text(`Q: ${pair.question}`, 10, yPos);
    yPos += 8;
    doc.text(`A: ${pair.answer || "No response"}`, 10, yPos);
    yPos += 10;
    if (yPos >= 280) {
      doc.addPage();
      yPos = 20;
    }
  });

  doc.save('interview_transcript.pdf');
  downloadModal.style.display = 'none';
});

/******************
 * Speech Synthesis Functions
 ******************/
function speakText(text, onFade, onEnd) {
  console.log("Attempting to speak:", text);
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = userSettings.speechRate;
  utterance.volume = userSettings.volume;

  const words = text.split(" ");
  const totalEstimatedDuration = (words.length * 500) / userSettings.speechRate;
  const fadeThreshold = totalEstimatedDuration - 1000; // Fade 1 sec before end

  let fadeTriggered = false;
  const fallbackTimer = setTimeout(() => {
    if (!fadeTriggered) {
      fadeTriggered = true;
      console.log("Fallback timer: triggering fade transition.");
      onFade();
    }
  }, fadeThreshold);

  let wordsSpoken = 0;
  utterance.onboundary = function(event) {
    if (event.name === 'word') {
      wordsSpoken++;
      if (wordsSpoken >= words.length - 1 && !fadeTriggered) {
        fadeTriggered = true;
        clearTimeout(fallbackTimer);
        console.log("Boundary event: triggering fade transition.");
        onFade();
      }
    }
  };

  utterance.onstart = function() {
    console.log("Speech started.");
    aiAvatar.play();
    avatarImage.style.opacity = "0";
  };

  utterance.onend = function() {
    console.log("Speech ended.");
    if (onEnd) onEnd();
  };

  utterance.onerror = function(event) {
    console.error("Speech synthesis error:", event.error);
  };

  window.speechSynthesis.speak(utterance);
}

function startFadeTransition() {
  aiAvatar.style.transition = 'opacity 2s ease';
  avatarImage.style.transition = 'opacity 2s ease';

  avatarImage.style.display = 'block';
  avatarImage.style.opacity = 0;

  setTimeout(() => {
    avatarImage.style.opacity = 1;
  }, 50);

  aiAvatar.style.opacity = 0;
  setTimeout(() => {
    aiAvatar.pause();
    aiAvatar.style.display = 'none';
  }, 1000);
}

/******************
 * Avatar Q&A Sequence Functions
 ******************/

// Introduction: Plays the introduction dialog without recording a Q&A pair.
function introduceAvatar() {
  const introText = introduction.dialog;
  questionTextDiv.style.display = 'block';
  questionTextDiv.textContent = introText;

  // Show avatar video and hide static image.
  avatarImage.style.display = 'none';
  avatarImage.style.opacity = 0;
  aiAvatar.style.display = 'block';
  aiAvatar.style.opacity = 1;
  aiAvatar.currentTime = 0;
  aiAvatar.play();

  speakText(introText, () => {
    startFadeTransition();
  }, () => {
    startCountdown(5, () => {
      questionTextDiv.style.display = 'none';
      askNextQuestion();
    });
  });
}

// For each question, capture Q&A pair.
function askNextQuestion() {
  if (currentQuestionIndex >= questions.length) return;

  const currentQ = questions[currentQuestionIndex].dialog || "No dialog available";
  currentQuestionText = currentQ;  // Set current question
  currentAnswer = "";              // Clear previous answer

  questionTextDiv.style.display = 'block';
  questionTextDiv.textContent = currentQ;

  // Show avatar video.
  avatarImage.style.display = 'none';
  avatarImage.style.opacity = 0;
  aiAvatar.style.display = 'block';
  aiAvatar.style.opacity = 1;
  aiAvatar.currentTime = 0;
  aiAvatar.play();

  speakText(currentQ, () => {
    startFadeTransition();
  }, () => {
    // Start a 20-second countdown for the user's answer.
    startCountdown(20, () => {
      // After countdown, push Q&A pair to transcriptData.
      transcriptData.push({ question: currentQuestionText, answer: currentAnswer.trim() });
      // Clear current Q&A variables.
      currentQuestionText = "";
      currentAnswer = "";
      questionTextDiv.style.display = 'none';
      currentQuestionIndex++;
      askNextQuestion();
    });
  });
}

/******************
 * Fetch Questions & Introduction from Server
 ******************/
async function fetchQuestions() {
  try {
    const response = await fetch('/get_questions');
    if (!response.ok) throw new Error("Network response was not ok");
    const data = await response.json();
    if (data.error) throw new Error(data.error);
    if (!data.introduction) throw new Error("No introduction dialog found in the database.");

    introduction = data.introduction;
    questions = data.questions;
    console.log("Fetched introduction:", introduction);
    console.log("Fetched questions:", questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    displayError("Failed to load interview questions. Please try again later.");
  }
}

/******************
 * Settings Modal Functionality
 ******************/
function toggleSettingsModal() {
  settingsModal.style.display = (settingsModal.style.display === 'block') ? 'none' : 'block';
}

if (closeSettingsBtn) {
  closeSettingsBtn.addEventListener('click', toggleSettingsModal);
}

if (settingsForm) {
  settingsForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const rateInput = document.getElementById('speechRate');
    const volumeInput = document.getElementById('speechVolume');
    userSettings.speechRate = parseFloat(rateInput.value) || 1;
    userSettings.volume = parseFloat(volumeInput.value) || 1;
    toggleSettingsModal();
  });
}

const speechRateSlider = document.getElementById('speechRate');
const speechRateValue = document.getElementById('speechRateValue');
speechRateSlider.addEventListener('input', function() {
  speechRateValue.textContent = this.value;
});

const speechVolumeSlider = document.getElementById('speechVolume');
const speechVolumeValue = document.getElementById('speechVolumeValue');
speechVolumeSlider.addEventListener('input', function() {
  speechVolumeValue.textContent = this.value;
});

/******************
 * Start Interview Button Handler
 ******************/
if (startInterviewBtn) {
  startInterviewBtn.addEventListener('click', async () => {
    startInterviewBtn.style.display = 'none';
    await fetchQuestions();
    introduceAvatar();
  });
}
