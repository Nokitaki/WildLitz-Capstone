// src/components/common/ClickableButton.jsx
// A button component that automatically plays click sounds

import React from 'react';

const ClickableButton = ({ 
  onClick, 
  children, 
  style = {}, 
  className = '',
  disabled = false,
  type = 'button',
  ...props 
}) => {
  
  const handleClick = (e) => {
    // Play click sound if available
    if (window.playClickSound && !disabled) {
      window.playClickSound();
    }
    
    // Call the original onClick handler
    if (onClick && !disabled) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={className}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.2s ease',
        ...style
      }}
      onMouseEnter={(e) => {
        if (!disabled && style.onMouseEnter) {
          style.onMouseEnter(e);
        } else if (!disabled) {
          e.target.style.transform = 'scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && style.onMouseLeave) {
          style.onMouseLeave(e);
        } else if (!disabled) {
          e.target.style.transform = 'scale(1)';
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
};

export default ClickableButton;

