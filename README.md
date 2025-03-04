# Ai_test_series_team0_25-2

# Interview App

## Overview

The Interview App is a virtual interview platform that simulates a real interview environment. A virtual avatar asks interview questions while the user's webcam feed is displayed. The app leverages speech synthesis to have the avatar speak the questions and speech recognition to capture the user's spoken responses. All questions and an introduction dialogue are stored in MongoDB, and at the end of the interview, the user's responses are compiled into a formatted PDF transcript for download.

## Features

- *Virtual Interview Experience:*  
  A virtual avatar asks dynamically fetched interview questions while the user's webcam feed is displayed.

- *Dynamic Content:*  
  Interview dialogs (introduction and questions) are stored in MongoDB and are randomly fetched at runtime.

- *Speech Synthesis & Recognition:*  
  The app uses the Web Speech API to synthesize speech for the avatar and to convert the user's speech into text.

- *Transcript Storage & PDF Generation:*  
  User responses are recorded and stored in MongoDB (with a TTL of 24 hours). At the end of the interview, users can download a PDF transcript that formats each question with its corresponding answer.

- *Interactive UI:*  
  The application includes a countdown timer between questions, a settings modal for adjusting speech rate and volume, and modals for confirming the end of an interview and downloading the transcript.

- *Responsive and Modern Design:*  
  The app features a dark minimalist theme with centered content and modals.

## Technologies Used

- *Backend:*  
  - [Flask](https://flask.palletsprojects.com/) – A lightweight Python web framework.
  - [PyMongo](https://pymongo.readthedocs.io/) – A Python driver for MongoDB.
  - [MongoDB](https://www.mongodb.com/) – A NoSQL database for storing interview dialogs and transcripts.

- *Frontend:*  
  - HTML5, CSS3, JavaScript  
  - [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) – For speech synthesis and speech recognition.
  - [jsPDF](https://github.com/parallax/jsPDF) – For generating PDF transcripts.
  - [Font Awesome](https://fontawesome.com/) – For icons.

## Installation

### Prerequisites

- Python 3.x
- MongoDB (either locally or via [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- pip

### Setup Steps

1. *Clone the Repository:*

   bash
   git clone <repository-url>
   cd <repository-directory>
   

2. *Create and Activate a Virtual Environment (optional but recommended):*

   bash
   python -m venv venv
   source venv/bin/activate    # On Windows: venv\Scripts\activate
   

3. *Install Dependencies:*

   bash
   pip install -r requirements.txt
   
   *Ensure that your requirements.txt includes Flask and PyMongo.*

4. *Configure MongoDB:*

   - If you're running MongoDB locally, ensure it is running and accessible at mongodb://127.0.0.1:27017/.
   - Insert documents into the dialogs collection of the avatarDialogsDB database:
     - At least one document with "category": "introduction" (e.g., { "category": "introduction", "dialog": "Welcome to the interview. I am your virtual interviewer." }).
     - Other documents with "category": "question" for interview questions.

5. *Run the Application:*

   bash
   python app.py
   
   The application should now be running on [http://127.0.0.1:5000](http://127.0.0.1:5000).

## Usage

1. *Start the Interview:*  
   Click the *Start Interview* button to begin. The app will fetch the introduction and questions from MongoDB and start the session.

2. *Avatar Interaction:*  
   The virtual avatar will introduce itself and then ask random interview questions. A countdown timer is displayed between questions.

3. *User Responses:*  
   Unmute the microphone to allow speech recognition to capture your responses. When muted, speech recognition stops.

4. *Ending the Interview:*  
   Click the *End Interview* button. A confirmation modal will appear, asking if you want to end the interview.  
   - Clicking *End Interview* stops the session and shows a download modal.
   - Clicking *Go Back* resumes the interview from where it was paused.

5. *Download Transcript:*  
   In the download modal, click *Download Result* to generate and download a formatted PDF transcript of your interview.

## Contributing

Contributions are welcome! Please fork the repository and create a pull request with your improvements or bug fixes.

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Flask](https://flask.palletsprojects.com/)
- [MongoDB](https://www.mongodb.com/)
- [jsPDF](https://github.com/parallax/jsPDF)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Font Awesome](https://fontawesome.com/)

---

Feel free to customize this README to best suit your project's details.
