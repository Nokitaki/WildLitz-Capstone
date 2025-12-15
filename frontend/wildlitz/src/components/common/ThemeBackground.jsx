// src/components/common/ThemeBackground.jsx
import React from 'react';

// Import all background images
import jungleImg from '../../assets/img/backgrounds/jungle.png';
import oceanImg from '../../assets/img/backgrounds/ocean.png';
import farmImg from '../../assets/img/backgrounds/farm.jpg';
import spaceImg from '../../assets/img/backgrounds/space.jpg';
import cityImg from '../../assets/img/backgrounds/city.jpg';
import fairytaleImg from '../../assets/img/backgrounds/fairy.jpg';

const ThemeBackground = ({ theme }) => {
  const backgrounds = {
    jungle: jungleImg,
    ocean: oceanImg,
    farm: farmImg,
    space: spaceImg,
    city: cityImg,
    fairytale: fairytaleImg
  };

  const currentBackground = backgrounds[theme] || backgrounds.jungle;

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundImage: `url(${currentBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.3, // Adjust transparency (0.1 to 1.0)
        pointerEvents: 'none',
        zIndex: 0,
        transition: 'background-image 0.5s ease-in-out' // Smooth transition
      }}
    />
  );
};

export default ThemeBackground;