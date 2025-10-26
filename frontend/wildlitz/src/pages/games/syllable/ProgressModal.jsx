// src/pages/games/syllable/ProgressModal.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import styles from "../../../styles/games/syllable/SyllableConfigScreen.module.css";
import { API_ENDPOINTS } from "../../../config/api";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ProgressModal = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [accuracyData, setAccuracyData] = useState(null);
  const [missedWords, setMissedWords] = useState([]);

  // Fetch all data on modal open
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        };

        const [summaryRes, accuracyRes, missedWordsRes] = await Promise.all([
          axios.get(`${API_ENDPOINTS.API_BASE_URL}/get-my-progress-summary/`, config),
          axios.get(`${API_ENDPOINTS.API_BASE_URL}/get-my-accuracy-over-time/`, config),
          axios.get(`${API_ENDPOINTS.API_BASE_URL}/get-my-most-missed-words/`, config),
        ]);

        setSummary(summaryRes.data);
        setAccuracyData(accuracyRes.data);
        setMissedWords(missedWordsRes.data);
      } catch (err) {
        console.error("Error fetching progress data:", err);
        setError("Could not load progress. Please make sure you are logged in.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format data for the line chart
  const lineChartData = {
    labels: Array.isArray(accuracyData) ? accuracyData.map((d) => d.date) : [],
    datasets: [
      {
        label: "My Accuracy (%)",
        data: Array.isArray(accuracyData) ? accuracyData.map((d) => d.accuracy) : [],
        fill: false,
        borderColor: "rgb(106, 90, 205)",
        backgroundColor: "rgba(106, 90, 205, 0.5)",
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "My Accuracy Over Time (Last 30 Days)",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function (value) {
            return value + "%";
          },
        },
      },
    },
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <span className={styles.spinner}></span>
          <p>Loading your progress...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ textAlign: "center", padding: "3rem", color: "red" }}>
          <p>{error}</p>
        </div>
      );
    }

    if (!summary || summary.total_attempts === 0) {
        return (
             <div style={{ textAlign: "center", padding: "3rem" }}>
                <h2>No Progress Yet!</h2>
                <p>Play a few games (while logged in) to see your progress here.</p>
            </div>
        )
    }

    return (
      <>
        {/* 1. Summary Stats */}
        <div className={styles.statsGrid} style={{gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '1.5rem'}}>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>🎯</div>
            {/* ✅ FIXED COLOR */}
            <div className={styles.statLabel} style={{ color: '#666' }}>Overall Accuracy</div>
            <div className={styles.statValue} style={{ color: '#333' }}>{summary.overall_accuracy}%</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>📚</div>
            {/* ✅ FIXED COLOR */}
            <div className={styles.statLabel} style={{ color: '#666' }}>Total Attempts</div>
            <div className={styles.statValue} style={{ color: '#333' }}>{summary.total_attempts}</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statIcon}>⭐</div>
            {/* ✅ FIXED COLOR */}
            <div className={styles.statLabel} style={{ color: '#666' }}>Favorite Difficulty</div>
            <div className={styles.statValue} style={{ color: '#333', textTransform: 'capitalize' }}>{summary.favorite_difficulty}</div>
          </div>
        </div>

        {/* 2. Charts and Missed Words */}
        <div style={{ display: 'flex', gap: '1rem', maxHeight: '400px' }}>
          {/* Line Chart */}
          <div className={styles.section} style={{ flex: 2, padding: '1rem' }}>
            <Line options={chartOptions} data={lineChartData} />
          </div>

          {/* "Most Missed Words" SECTION */}
          <div className={styles.section} style={{ flex: 1, padding: '1rem' }}>
            <h3 style={{marginTop: 0, color: '#333'}}>My Top 5 Missed Words</h3>
            {/* ✅ ADDED SAFETY CHECK HERE */}
            {Array.isArray(missedWords) && missedWords.length > 0 ? (
                 <div className={styles.customList} style={{padding: 0}}>
                    {/* This .map() is now safe */}
                    {missedWords.map((item, index) => (
                        <div className={styles.wordItem} key={index}>
                            <span className={styles.wordText}>{item.word}</span>
                            <span className={styles.wordCategory} style={{backgroundColor: '#ffebee', color: '#c62828'}}>
                                Missed {item.missed_count} {item.missed_count > 1 ? 'times' : 'time'}
                            </span>
                        </div>
                    ))}
                 </div>
            ) : (
                <p style={{fontSize: '0.9rem', color: '#666', textAlign: 'center', marginTop: '2rem'}}>
                    Great job! You haven't missed any words repeatedly.
                </p>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div
        className={styles.modal}
        style={{
          width: '1100px',
          height: '750px',
          maxWidth: '90vw', 
          maxHeight: '90vh' 
        }}
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2>📊 My Progress</h2>
          <motion.button
            className={styles.closeButton}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
          >
            ✕
          </motion.button>
        </div>

        <div 
          className={styles.wordForm} 
          style={{ 
            paddingBottom: '1.5rem', 
            overflowY: 'auto', 
            height: 'calc(100% - 70px)'
          }}
        >
          {renderContent()}
        </div>
      </motion.div>
    </div>
  );
};

export default ProgressModal;