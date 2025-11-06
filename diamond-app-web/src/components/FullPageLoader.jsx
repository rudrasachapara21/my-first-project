import React from 'react';
import styled from 'styled-components';
import Lottie from 'lottie-react';
import { diamondAnimation } from '../assets/animationData'; // Assuming this animation is in your assets

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: ${props => props.theme.bgPrimary || 'rgba(255, 255, 255, 0.9)'};
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

/**
 * A full-page loading indicator used when the application is initializing
 * or performing a critical background task.
 */
function FullPageLoader() {
  return (
    <Overlay>
      <Lottie
        animationData={diamondAnimation}
        loop={true}
        style={{ width: 150, height: 150 }}
      />
    </Overlay>
  );
}

// It's good practice to wrap the component in a theme provider
// in case it's rendered outside of the main theme context.
import { useTheme } from '../context/ThemeContext';
import { ThemeProvider } from 'styled-components';

const ThemedFullPageLoader = () => {
    const { currentTheme } = useTheme() || {};
    if (!currentTheme) return <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'white' }} />; // Fallback

    return (
        <ThemeProvider theme={currentTheme}>
            <FullPageLoader />
        </ThemeProvider>
    );
};


export default ThemedFullPageLoader;