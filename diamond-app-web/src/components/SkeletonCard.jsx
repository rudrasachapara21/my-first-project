import React from 'react';
// The import for styled-components was missing. It is now fixed.
import styled, { keyframes } from 'styled-components';

const shimmer = keyframes`
  0% { background-position: -468px 0; }
  100% { background-position: 468px 0; }
`;

const SkeletonWrapper = styled.div`
  background: ${props => props.theme.bgSecondary};
  border: 1px solid ${props => props.theme.borderColor};
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 15px rgba(0,0,0,0.05);
`;

const SkeletonLine = styled.div`
  height: ${props => props.$height || '1rem'};
  width: ${props => props.$width || '100%'};
  margin-bottom: ${props => props.$mb || '0.75rem'};
  border-radius: 8px;
  
  background-color: #f6f7f8;
  background-image: linear-gradient(to right, #eeeeee 0%, #dddddd 20%, #eeeeee 40%, #eeeeee 100%);
  background-repeat: no-repeat;
  background-size: 800px 104px;
  animation: ${shimmer} 1.5s linear infinite;
`;

const SkeletonImage = styled(SkeletonLine)`
    height: 250px;
    width: 100%;
    margin-bottom: 1rem;
`;

export function SkeletonListingCard() {
    return (
        <SkeletonWrapper>
            <SkeletonImage />
            <SkeletonLine $height="1.2rem" $width="60%" $mb="1rem"/>
            <SkeletonLine $height="1rem" $width="40%" $mb="1rem"/>
            <SkeletonLine $height="0.9rem" $width="80%" $mb="1.5rem"/>
            <SkeletonLine $height="3rem" $width="100%" $mb="0"/>
        </SkeletonWrapper>
    )
}

export function SkeletonDemandCard() {
  return (
    <SkeletonWrapper>
      <SkeletonLine $height="1.4rem" $width="70%" $mb="1.5rem" />
      <SkeletonLine $height="1.1rem" $width="40%" $mb="1.5rem"/>
      <SkeletonLine $height="0.9rem" $width="50%" $mb="1.5rem" />
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <SkeletonLine $height="1.5rem" $width="40%" $mb="0" />
        <SkeletonLine $height="2.5rem" $width="40%" $mb="0" />
      </div>
    </SkeletonWrapper>
  );
}