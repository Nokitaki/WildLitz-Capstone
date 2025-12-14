// src/components/profile/ModulePerformanceChart.jsx
import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { motion } from 'framer-motion';

const ModulePerformanceChart = ({ 
  moduleName, 
  data, 
  xAxisLabel = "Difficulty Level", 
  yAxisLabel = "Accuracy (%)" 
}) => {
  // Safety check
  const safeData = Array.isArray(data) ? data : [];
  
  // ✅ SMART SORT: Handles "Easy/Hard" AND "1 Episode"
  const sortedData = [...safeData].sort((a, b) => {
    const valA = (a.difficulty || '').toString().toLowerCase();
    const valB = (b.difficulty || '').toString().toLowerCase();
    
    // 1. Check if they are "Episodes"
    if (valA.includes('episode') && valB.includes('episode')) {
       // Extract numbers ("1 Episode" -> 1, "Episode 1" -> 1)
       const numA = parseInt(valA.replace(/\D/g, '')) || 0;
       const numB = parseInt(valB.replace(/\D/g, '')) || 0;
       return numA - numB;
    }

    // 2. Fallback to standard difficulty sort
    const sortOrder = { 'easy': 1, 'medium': 2, 'hard': 3, 'expert': 4 };
    return (sortOrder[valA] || 99) - (sortOrder[valB] || 99);
  });

  const avgAccuracy = safeData.length > 0
    ? Math.round(safeData.reduce((sum, item) => sum + (item.accuracy_percentage || 0), 0) / safeData.length)
    : 0;

  const getBarColor = (score) => {
    if (score >= 80) return '#4CAF50'; // Green
    if (score >= 50) return '#FFC107'; // Yellow
    return '#F44336'; // Red
  };

  const totalAttempts = safeData.reduce((sum, item) => sum + (item.total_attempts || 0), 0);
  const correctCount = safeData.reduce((sum, item) => sum + (item.correct_answers || 0), 0);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: '1px solid #eee',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 5px', fontWeight: 'bold', color: '#333', textTransform: 'capitalize' }}>
            {label}
          </p>
          <p style={{ margin: 0, color: getBarColor(dataPoint.accuracy_percentage) }}>
            🎯 Accuracy: {Math.round(dataPoint.accuracy_percentage)}%
          </p>
          <p style={{ margin: '5px 0 0', fontSize: '0.85rem', color: '#666' }}>
            ✅ Correct: {dataPoint.correct_answers}
          </p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
            ⏱️ Avg Time: {Math.round(dataPoint.average_time_per_question || 0)}s
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        border: '1px solid #eee',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '400px',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>{moduleName}</h3>
          <span style={{ fontSize: '0.85rem', color: '#888' }}>Last 30 Days</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getBarColor(avgAccuracy) }}>
            {avgAccuracy}%
          </div>
          <div style={{ fontSize: '0.8rem', color: '#888' }}>Avg. Accuracy</div>
        </div>
      </div>

      {/* Chart Container */}
      <div style={{ flex: 1, minHeight: '220px', width: '100%' }}>
        <ResponsiveContainer width="99%" height="100%">
          <BarChart 
            data={sortedData} 
            margin={{ top: 10, right: 10, left: 0, bottom: 25 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            
            <XAxis 
              dataKey="difficulty" 
              // Convert "1 Episode" -> "1 Ep." or "Episode 1" -> "Ep. 1"
              tickFormatter={(val) => val ? val.toString().replace('Episode', 'Ep.') : ''}
              axisLine={false}
              tickLine={false}
              dy={10}
              style={{ fontSize: '0.75rem', fill: '#888', fontWeight: 600 }}
              label={{ 
                value: xAxisLabel, 
                position: 'insideBottom', 
                offset: -15, 
                style: { fill: '#aaa', fontSize: '0.7rem', fontWeight: 600 } 
              }}
            />

            <YAxis 
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
              tickCount={5}
              style={{ fontSize: '0.75rem', fill: '#888' }}
              label={{ 
                value: yAxisLabel, 
                angle: -90, 
                position: 'insideLeft', 
                style: { fill: '#aaa', fontSize: '0.7rem', fontWeight: 600, textAnchor: 'middle' } 
              }}
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            
            <Bar 
              dataKey="accuracy_percentage" 
              radius={[6, 6, 0, 0]}
              barSize={45}
              animationDuration={1200}
            >
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.accuracy_percentage)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: '10px',
        marginTop: '20px',
        paddingTop: '20px',
        borderTop: '1px solid #f8f9fa'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#333' }}>
            {totalAttempts}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Attempts</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#333' }}>
            {correctCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Correct</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#333' }}>
            {data.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sessions</div>
        </div>
      </div>
    </motion.div>
  );
};

export default ModulePerformanceChart;