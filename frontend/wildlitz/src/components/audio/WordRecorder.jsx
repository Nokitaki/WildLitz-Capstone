// Create a new file: src/components/audio/WordRecorder.jsx

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import '../../styles/word_recorder.css';

const WordRecorder = ({ word, onRecordingComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioURL, setAudioURL] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [hasRecording, setHasRecording] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  
  // Start recording function
  const startRecording = async () => {
    try {
      // Reset previous recording
      if (audioURL) {
        URL.revokeObjectURL(audioURL);
        setAudioURL('');
      }
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Setup data handler
      const audioChunks = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        setAudioBlob(audioBlob);
        setHasRecording(true);
        
        // Pass the recording data to parent component
        if (onRecordingComplete) {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64data = reader.result;
            onRecordingComplete(base64data, audioBlob);
          };
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please ensure you have granted permission.');
    }
  };
  
  // Stop recording function
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop timer
      clearInterval(timerRef.current);
      
      // Stop all tracks in the stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };
  
  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };
  
  // Handle play/pause of recorded audio
  const togglePlayback = () => {
    if (audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  };
  
  return (
    <div className="word-recorder">
      <div className="recorder-header">
        <h4>Record Pronunciation for "{word}"</h4>
      </div>
      
      <div className="recorder-controls">
        {!isRecording ? (
          <motion.button 
            className="recorder-button record"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startRecording}
            disabled={isRecording}
          >
            <span role="img" aria-label="Record">🎙️</span> Record
          </motion.button>
        ) : (
          <motion.button 
            className="recorder-button stop"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopRecording}
          >
            <span role="img" aria-label="Stop">⏹️</span> Stop ({formatTime(recordingTime)})
          </motion.button>
        )}
      </div>
      
      {hasRecording && (
        <div className="playback-controls">
          <audio ref={audioRef} src={audioURL} />
          <button className="playback-button" onClick={togglePlayback}>
            <span role="img" aria-label="Play">▶️</span> Play Recording
          </button>
          <button className="recorder-button record" onClick={startRecording}>
            <span role="img" aria-label="Record">🔄</span> Re-record
          </button>
        </div>
      )}
      
      <div className="recorder-status">
        {isRecording ? (
          <span className="recording-badge">Recording... {formatTime(recordingTime)}</span>
        ) : hasRecording ? (
          <span className="success-badge">Recording saved!</span>
        ) : (
          <span className="info-badge">No recording yet</span>
        )}
      </div>
    </div>
  );
};

export default WordRecorder;