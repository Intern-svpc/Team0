/******************
 * User Webcam Setup
 ******************/
const userWebcam = document.getElementById('userWebcam');
const errorMessageDiv = document.getElementById('errorMessage');
let stream = null;

async function startWebcam() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    // Start with audio muted and video off
    stream.getAudioTracks().forEach(track => track.enabled = false);
    stream.getVideoTracks().forEach(track => track.enabled = false);
    userWebcam.srcObject = stream;
  } catch (err) {
    console.error("Error accessing webcam:", err);
    displayError("Unable to access webcam. Please check your permissions.");
  }
}
startWebcam();

function displayError(message) {
  if (errorMessageDiv) {
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';
  } else {
    alert(message);
  }
}

/******************
 * Button Event Listeners
 ******************/
document.getElementById('muteButton').addEventListener('click', function () {
  if (stream) {
    let audioTracks = stream.getAudioTracks();
    if (audioTracks.length > 0) {
      let isAudioEnabled = audioTracks[0].enabled;
      audioTracks.forEach(track => track.enabled = !isAudioEnabled);
      updateButton(this, isAudioEnabled ? 'mute' : 'unmute');
    }
  }
});

document.getElementById('webcamButton').addEventListener('click', function () {
  if (stream) {
    let videoTracks = stream.getVideoTracks();
    if (videoTracks.length > 0) {
      let isVideoEnabled = videoTracks[0].enabled;
      videoTracks.forEach(track => track.enabled = !isVideoEnabled);
      updateButton(this, isVideoEnabled ? 'videoOff' : 'videoOn');
    }
  }
});

document.getElementById('endInterviewButton').addEventListener('click', function () {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
  }
  alert("Interview Ended");
});

document.getElementById('settingsButton').addEventListener('click', function () {
  toggleSettingsModal();
});

// Update button icon and style based on state
function updateButton(button, action) {
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

/******************************************
 * Countdown Timer Functionality
 ******************************************/
function startCountdown(seconds, callback) {
  const timerDiv = document.getElementById('timer');
  timerDiv.style.display = 'block';
  timerDiv.textContent = seconds;
  const interval = setInterval(() => {
    seconds--;
    timerDiv.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(interval);
      timerDiv.style.display = 'none';
      if (callback) callback();
    }
  }, 1000);
}

/******************************************
 * Speech Synthesis Functions
 ******************************************/
let userSettings = {
  speechRate: 1, // normal speed
  volume: 1      // full volume
};

/**
 * speakText: Speaks the provided text and triggers a fade transition
 * approximately 1 second before the estimated end of the speech.
 */
function speakText(text, onFade, onEnd) {
  console.log("Attempting to speak:", text);
  window.speechSynthesis.cancel(); // Cancel any pending utterances
  let utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = userSettings.speechRate;
  utterance.volume = userSettings.volume;
  
  let words = text.split(" ");
  let totalEstimatedDuration = (words.length * 500) / userSettings.speechRate; // in ms
  let fadeThreshold = totalEstimatedDuration - 1000; // trigger fade 1 sec before estimated end
  
  let fadeTriggered = false;
  let fallbackTimer = setTimeout(() => {
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

/**
 * startFadeTransition: Fades from the avatar video to its static image.
 */
function startFadeTransition() {
  avatarVideo.style.transition = 'opacity 1s ease';
  avatarImage.style.transition = 'opacity 1s ease';
  
  avatarImage.style.display = 'block';
  avatarImage.style.opacity = 0;
  
  setTimeout(() => {
    avatarImage.style.opacity = 1;
  }, 50);
  
  avatarVideo.style.opacity = 0;
  
  setTimeout(() => {
    avatarVideo.pause();
    avatarVideo.style.display = 'none';
  }, 1000);
}

/******************************************
 * Avatar Introduction & Question Sequence
 ******************************************/
let introduction;  // Holds the introduction dialog from MongoDB
let questions = []; // Holds the other question dialogs
let currentQuestionIndex = 0;
const avatarVideo = document.getElementById('aiAvatar');
const avatarImage = document.getElementById('avatarImage');
const questionTextDiv = document.getElementById('questionText');

/**
 * introduceAvatar: Speaks the introduction dialog retrieved from the database.
 * After the introduction finishes, waits 5 seconds (with countdown) before starting the questions.
 */
function introduceAvatar() {
  const introText = introduction.dialog;
  questionTextDiv.style.display = 'block';
  questionTextDiv.textContent = introText;
  
  // Ensure video is visible and image is hidden.
  avatarImage.style.display = 'none';
  avatarImage.style.opacity = 0;
  avatarVideo.style.display = 'block';
  avatarVideo.style.opacity = 1;
  avatarVideo.currentTime = 0;
  avatarVideo.play();
  
  speakText(introText, () => {
    startFadeTransition();
  }, () => {
    // After speech ends, wait 5 seconds with countdown then begin asking questions.
    startCountdown(5, () => {
      questionTextDiv.style.display = 'none';
      askNextQuestion();
    });
  });
}

/**
 * askNextQuestion: Speaks the next question from the questions array.
 * Waits 20 seconds (with countdown) after each question before proceeding.
 */
function askNextQuestion() {
  if (currentQuestionIndex >= questions.length) return;
  
  let questionData = questions[currentQuestionIndex];
  let question = questionData.dialog || "No dialog available";
  questionTextDiv.style.display = 'block';
  questionTextDiv.textContent = question;
  
  // Reset video display.
  avatarImage.style.display = 'none';
  avatarImage.style.opacity = 0;
  avatarVideo.style.display = 'block';
  avatarVideo.style.opacity = 1;
  avatarVideo.currentTime = 0;
  avatarVideo.play();
  
  speakText(question, () => {
    startFadeTransition();
  }, () => {
    // After finishing the question, wait 20 seconds with countdown then move to the next question.
    startCountdown(20, () => {
      questionTextDiv.style.display = 'none';
      currentQuestionIndex++;
      askNextQuestion();
    });
  });
}

/******************************************
 * Fetch Introduction & Questions from Server
 ******************************************/
async function fetchQuestions() {
  try {
    let response = await fetch('/get_questions');
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    let data = await response.json();
    if (data.error) {
      throw new Error(data.error);
    }
    if (!data.introduction) {
      throw new Error("No introduction dialog found in the database.");
    }
    introduction = data.introduction;
    questions = data.questions;
    console.log("Fetched introduction:", introduction);
    console.log("Fetched questions:", questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    displayError("Failed to load interview questions. Please try again later.");
  }
}

/******************************************
 * Settings Modal Functionality
 ******************************************/
const settingsModal = document.getElementById('settingsModal');
const settingsForm = document.getElementById('settingsForm');
const closeSettingsButton = document.getElementById('closeSettings');

function toggleSettingsModal() {
  settingsModal.style.display = (settingsModal.style.display === 'block') ? 'none' : 'block';
}

if (closeSettingsButton) {
  closeSettingsButton.addEventListener('click', toggleSettingsModal);
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

/******************************************
 * Start Interview Button Functionality
 ******************************************/
const startInterviewButton = document.getElementById('startInterview');
if (startInterviewButton) {
  startInterviewButton.addEventListener('click', async () => {
    startInterviewButton.style.display = 'none';
    await fetchQuestions();  // Fetch introduction and questions from the server
    introduceAvatar();       // Start by playing the introduction dialog
  });
}
