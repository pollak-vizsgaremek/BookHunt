import React from 'react';
import PixelSnow from './PixelSnow';

const ChristmasTheme: React.FC = () => {
  return (
    <PixelSnow 
      variant="snowflake"
      color="#ffffff"
      pixelResolution={2000}
      flakeSize={0.014}
      density={0.7}
      direction={90}
      depthFade={10}
      farPlane={14}
      speed={1.3}
      brightness={2}
    />
  );
};

export default ChristmasTheme;
