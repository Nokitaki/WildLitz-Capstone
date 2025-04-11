import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import '../../styles/voice_input_recorder.css';

const VoiceInputRecorder = ({ onWordRecognized }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(true);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recognitionRef = useRef(null);
  
  // Check if SpeechRecognition is supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setRecognitionSupported(false);
      setError('Speech recognition is not supported in your browser.');
    }
  }, []);
  
  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    
    recognitionRef.current.onresult = (event) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript;
      setTranscript(transcript);
    };
    
    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      setError(`Error: ${event.error}`);
      stopListening();
    };
    
    recognitionRef.current.onend = () => {
      if (isListening) {
        // If we're still in listening mode but recognition ended, restart it
        recognitionRef.current.start();
      }
    };
  };
  
  // Start listening and recording
  const startListening = async () => {
    setError('');
    setTranscript('');
    setIsListening(true);
    
    try {
      // Initialize speech recognition if not already
      if (!recognitionRef.current) {
        initializeSpeechRecognition();
      }
      
      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      // Start audio recording for saving the voice
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.start();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Could not access microphone. Please ensure you have granted permission.');
      setIsListening(false);
    }
  };
  
  // Stop listening and analyze the word
  const stopListening = async () => {
    setIsListening(false);
    
    // Stop speech recognition
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      
      // Process the audio when recording stops
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // If we have a transcript, analyze it
        if (transcript.trim()) {
          analyzeWord(transcript.trim(), audioBlob);
        }
      };
      
      // Stop all tracks in the stream
      if (mediaRecorderRef.current.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    }
  };
  
  // Analyze the recognized word
  const analyzeWord = async (word, audioBlob) => {
    if (!word) return;
    
    setIsAnalyzing(true);
    
    try {
      // Convert audioBlob to base64 for storage
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64AudioData = reader.result;
        
        // Call the API to analyze the word
        try {
          const response = await axios.post('/api/syllabification/analyze-word/', {
            word: word,
            audioData: base64AudioData
          });
          
          if (response.data) {
            // Call the callback with the analyzed word data
            onWordRecognized({
              word: response.data.word || word,
              syllableBreakdown: response.data.syllable_breakdown || word,
              syllableCount: response.data.syllable_count || 1,
              category: response.data.category || 'General',
              customAudio: base64AudioData,
              usesCustomAudio: true
            });
            
            // Reset the state for next word
            setTranscript('');
            setIsAnalyzing(false);
          }
        } catch (apiError) {
          console.error('Error calling API:', apiError);
          
          // Fallback: use client-side analysis if API fails
          const analyzed = analyzeWordLocally(word);
          
          onWordRecognized({
            word: word,
            syllableBreakdown: analyzed.syllableBreakdown,
            syllableCount: analyzed.syllableCount,
            category: analyzed.category,
            customAudio: base64AudioData,
            usesCustomAudio: true
          });
          
          setTranscript('');
          setIsAnalyzing(false);
        }
      };
    } catch (error) {
      console.error('Error analyzing word:', error);
      setError('Error analyzing the word. Please try again.');
      setIsAnalyzing(false);
    }
  };
  
  // Simple client-side word analysis as fallback
  const analyzeWordLocally = (word) => {
    // Basic syllable counting
    const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
    let syllableCount = 0;
    let inVowelGroup = false;
    
    for (let i = 0; i < word.length; i++) {
      const isVowel = vowels.includes(word[i].toLowerCase());
      
      if (isVowel && !inVowelGroup) {
        syllableCount++;
        inVowelGroup = true;
      } else if (!isVowel) {
        inVowelGroup = false;
      }
    }
    
    // Ensure at least one syllable
    syllableCount = Math.max(1, syllableCount);
    
    // Handle silent e at the end
    if (word.endsWith('e') && word.length > 2 && !vowels.includes(word[word.length-2].toLowerCase())) {
      syllableCount = Math.max(1, syllableCount - 1);
    }
    
    // Simple syllable breakdown
    let syllableBreakdown = word;
    if (syllableCount > 1) {
      // Try to break at vowel-consonant boundaries
      let result = [];
      let current = "";
      let vowelSeenInCurrent = false;
      
      for (let i = 0; i < word.length; i++) {
        const isVowel = vowels.includes(word[i].toLowerCase());
        
        // Add current character to current syllable
        current += word[i];
        
        if (isVowel) {
          vowelSeenInCurrent = true;
        }
        
        // Try to break syllables after vowel+consonant patterns
        if (vowelSeenInCurrent && !isVowel && i < word.length - 1) {
          // Look ahead - if next char is also a consonant, don't break yet
          const nextIsConsonant = !vowels.includes(word[i+1].toLowerCase());
          
          if (!nextIsConsonant) {
            result.push(current);
            current = "";
            vowelSeenInCurrent = false;
          }
        }
      }
      
      // Add any remaining characters
      if (current) {
        result.push(current);
      }
      
      // If our algorithm didn't produce the right number of syllables,
      // fall back to a simple division
      if (result.length !== syllableCount) {
        result = [];
        const charsPerSyllable = Math.floor(word.length / syllableCount);
        
        for (let i = 0; i < syllableCount; i++) {
          const start = i * charsPerSyllable;
          const end = (i === syllableCount - 1) ? word.length : (i + 1) * charsPerSyllable;
          result.push(word.substring(start, end));
        }
      }
      
      syllableBreakdown = result.join("-");
    }
    
    // Very basic category detection
    const lowerWord = word.toLowerCase();
    const animalWords = ['cat', 'dog', 'bird', 'fish', 'lion', 'tiger', 'bear', 'elephant'];
    const colorWords = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'black', 'white'];
    const foodWords = ['apple', 'banana', 'orange', 'pizza', 'burger', 'rice', 'bread'];
    
    let category = 'General';
    if (animalWords.includes(lowerWord)) category = 'Animals';
    else if (colorWords.includes(lowerWord)) category = 'Colors';
    else if (foodWords.includes(lowerWord)) category = 'Food Items';
    
    return {
      category,
      syllableCount,
      syllableBreakdown
    };
  };
  
  return (
    <div className="voice-input-recorder simplified">
      <h3>Speak a Word to Add</h3>
      
      <div className="voice-controls">
        {!isListening ? (
          <motion.button 
            className="voice-button start"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startListening}
            disabled={!recognitionSupported || isAnalyzing}
          >
            <span role="img" aria-label="Microphone">🎤</span> Speak a Word
          </motion.button>
        ) : (
          <motion.button 
            className="voice-button stop"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopListening}
          >
            <span role="img" aria-label="Stop">⏹️</span> Stop
          </motion.button>
        )}
      </div>
      
      {isListening && (
        <div className="listening-indicator">
          <div className="pulse-ring"></div>
          <p>Listening... Speak clearly</p>
        </div>
      )}
      
      {transcript && (
        <div className="transcript-display">
          <p>Heard: "{transcript}"</p>
        </div>
      )}
      
      {isAnalyzing && (
        <div className="analyzing-indicator">
          <p>Analyzing word...</p>
          <div className="analyzing-spinner"></div>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {!recognitionSupported && (
        <div className="browser-warning">
          Speech recognition is not supported in your browser. 
          Please try Chrome, Edge, or Safari.
        </div>
      )}
      
      <div className="voice-instructions">
        <p>Speak a single word clearly into your microphone. The AI will automatically:</p>
        <ul>
          <li>Identify the word</li>
          <li>Determine its category</li>
          <li>Break it into syllables</li>
          <li>Save your voice for playback</li>
        </ul>
      </div>
    </div>
  );
};

export default VoiceInputRecorder;