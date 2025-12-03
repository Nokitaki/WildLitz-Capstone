// useClapDetection.jsx
// Custom React hook for detecting claps through microphone
// Place this file in the same folder as SyllableClappingGame.jsx

import { useEffect, useRef, useState } from "react";

const useClapDetection = (isEnabled = false, onClapDetected) => {
  const [isListening, setIsListening] = useState(false);
  const [micPermission, setMicPermission] = useState(null); // 'granted', 'denied', 'prompt'
  const [errorMessage, setErrorMessage] = useState("");

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const microphoneRef = useRef(null);
  const dataArrayRef = useRef(null);
  const lastClapTimeRef = useRef(0);
  const animationFrameRef = useRef(null);

  // Configuration constants
  const CLAP_THRESHOLD = 0.35; // Volume threshold (0-1) for clap detection
  const DEBOUNCE_TIME = 250; // Minimum milliseconds between claps
  const FFT_SIZE = 2048; // Frequency analysis resolution
  const SMOOTHING = 0.8; // Audio smoothing (0-1)

  // Initialize Audio Context and Analyser
  const initializeAudio = async () => {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: flase,
          autoGainControl: false, // Disable AGC to get raw volume
        },
      });

      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext();

      // Create analyser node
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = FFT_SIZE;
      analyserRef.current.smoothingTimeConstant = SMOOTHING;

      // Connect microphone to analyser
      microphoneRef.current =
        audioContextRef.current.createMediaStreamSource(stream);
      microphoneRef.current.connect(analyserRef.current);

      // Create data array for frequency analysis
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Uint8Array(bufferLength);

      setMicPermission("granted");
      setIsListening(true);
      setErrorMessage("");

      // Start analyzing audio
      analyzeAudio();
    } catch (error) {
      console.error("Microphone access error:", error);

      if (
        error.name === "NotAllowedError" ||
        error.name === "PermissionDeniedError"
      ) {
        setMicPermission("denied");
        setErrorMessage(
          "Microphone access denied. Please allow microphone access in your browser settings."
        );
      } else if (error.name === "NotFoundError") {
        setErrorMessage(
          "No microphone found. Please connect a microphone and try again."
        );
      } else {
        setErrorMessage("Failed to access microphone: " + error.message);
      }

      setIsListening(false);
    }
  };

  // Analyze audio data for claps
  const analyzeAudio = () => {
    if (!analyserRef.current || !dataArrayRef.current) return;

    // Get frequency data
    analyserRef.current.getByteFrequencyData(dataArrayRef.current);

    // Calculate average volume (RMS)
    let sum = 0;
    for (let i = 0; i < dataArrayRef.current.length; i++) {
      sum += dataArrayRef.current[i];
    }
    const average = sum / dataArrayRef.current.length;
    const normalizedVolume = average / 255; // Normalize to 0-1
    console.log(
      "🎤 Volume:",
      normalizedVolume.toFixed(2),
      "Threshold:",
      CLAP_THRESHOLD
    );

    // Detect clap based on volume spike
    const now = Date.now();
    const timeSinceLastClap = now - lastClapTimeRef.current;

    if (normalizedVolume > CLAP_THRESHOLD) {
      console.log("🔊 LOUD SOUND!", normalizedVolume.toFixed(2));
    }

    // Check if volume exceeds threshold AND enough time has passed
    if (
      normalizedVolume > CLAP_THRESHOLD &&
      timeSinceLastClap > DEBOUNCE_TIME
    ) {
      // Additional validation: Check if it's in the clap frequency range
      // Claps typically have energy in 1kHz-4kHz range
      const isClapLike = validateClapFrequency(dataArrayRef.current);

      if (isClapLike) {
        console.log("✅ CLAP DETECTED! Triggering callback...");
        lastClapTimeRef.current = now;

        // Trigger the clap callback
        if (onClapDetected) {
          onClapDetected();
        }
      } else {
        console.log("❌ Failed frequency validation - not a clap");
      }
    }

    // Continue analyzing
    animationFrameRef.current = requestAnimationFrame(analyzeAudio);
  };

  // Validate if the sound has clap-like frequency characteristics
  const validateClapFrequency = (dataArray) => {
    // Claps have a sharp attack in mid-to-high frequencies
    // We'll check bins corresponding to 1kHz-4kHz
    const sampleRate = audioContextRef.current?.sampleRate || 44100;
    const binFrequency = sampleRate / FFT_SIZE;

    const lowFreqBin = Math.floor(1000 / binFrequency); // 1kHz
    const highFreqBin = Math.floor(4000 / binFrequency); // 4kHz

    let clapBandEnergy = 0;
    let otherBandEnergy = 0;

    for (let i = 0; i < dataArray.length; i++) {
      if (i >= lowFreqBin && i <= highFreqBin) {
        clapBandEnergy += dataArray[i];
      } else {
        otherBandEnergy += dataArray[i];
      }
    }

    // Claps should have more energy in the 1-4kHz range
    const clapBandAvg = clapBandEnergy / (highFreqBin - lowFreqBin);
    const otherBandAvg =
      otherBandEnergy / (dataArray.length - (highFreqBin - lowFreqBin));

    const ratio = clapBandAvg / otherBandAvg;
    const isValid = ratio > 1.2; // Lowered from 1.5 to 1.2 to be less strict

    console.log("🎵 Frequency validation:", {
      clapBandAvg: clapBandAvg.toFixed(2),
      otherBandAvg: otherBandAvg.toFixed(2),
      ratio: ratio.toFixed(2),
      passed: isValid,
      requiredRatio: "> 1.2",
    });

    return isValid;
  };

  // Stop listening and cleanup
  const stopListening = () => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Close microphone stream
    if (microphoneRef.current && microphoneRef.current.mediaStream) {
      microphoneRef.current.mediaStream
        .getTracks()
        .forEach((track) => track.stop());
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }

    audioContextRef.current = null;
    analyserRef.current = null;
    microphoneRef.current = null;
    dataArrayRef.current = null;

    setIsListening(false);
  };

  // Start/stop based on isEnabled prop
  useEffect(() => {
    if (isEnabled && !isListening) {
      initializeAudio();
    } else if (!isEnabled && isListening) {
      stopListening();
    }

    // Cleanup on unmount
    return () => {
      stopListening();
    };
  }, [isEnabled]);

  return {
    isListening,
    micPermission,
    errorMessage,
    startListening: initializeAudio,
    stopListening,
  };
};

export default useClapDetection;
