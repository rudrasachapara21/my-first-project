Diamond Connect - B2B Marketplace (Front-End Prototype)
Project Status: In Development (Front-End Complete)
Last Updated: September 7, 2025
Primary Technology: React (Vite)
Styling: styled-components

1. Project Overview
This repository contains the source code for the "Diamond Connect" B2B marketplace, a high-fidelity front-end prototype. The application is designed to connect diamond Traders and Brokers, providing a platform for posting demands, listing diamonds for sale, and facilitating connections.

This prototype was built by translating an original HTML, CSS, and JavaScript demo into a modern React web application. It is fully interactive, responsive, and designed to feel like a real, working application, complete with sample data, interactive forms, and a creative loading animation.

2. Project History & Development Journey
The development of this application followed a common but challenging path, starting with an attempt at a mobile-native build before pivoting to a more robust and flexible web application.

Initial Goal (React Native): The project began with the goal of building a mobile app for iOS and Android using React Native. This phase was halted due to persistent and complex environment issues related to Xcode, CocoaPods, and Apple Silicon (M1/M2) architecture conflicts. After extensive troubleshooting, it was clear the native development environment itself was the blocker.

Pivot to Web Technology: A decision was made to pivot to a standard React web application using Vite. This approach immediately resolved all build issues and allowed for rapid development. The web app is fully responsive and provides an excellent mobile experience through the browser, fulfilling the original requirement.

Core Feature Implementation: The initial HTML/CSS/JS prototype was successfully translated into React components. Key features were built out, including page navigation, a centralized theme management system, and individual pages for all user flows.

Creative Polish & UX: To elevate the prototype, a custom loading animation (using Lottie) was implemented on the login page to simulate network activity and provide a polished user experience, as per the user's creative direction.

Finalization: The final phase involved a deep review of the original design documents to ensure every page had its correct, unique header, all buttons were functional, and all placeholder content was replaced with realistic sample data to make the app feel complete.

3. Core Technologies & Libraries
This project is built on a modern front-end stack.

Framework: React 18 (using Vite for the build tool)

Why: Provides a fast development environment and a robust component-based architecture.

Routing: React Router DOM (react-router-dom)

Why: The standard library for handling navigation between different pages in a React application.

Styling: Styled Components (styled-components)

Why: Allows for writing CSS directly within JavaScript components, which is excellent for creating dynamic, theme-able, and scoped styles. This was crucial for implementing the theme switcher.

Animations: Lottie for React (lottie-react)

Why: Enables the use of high-quality, lightweight JSON-based animations, perfect for the custom diamond loading animation.

Icons: React Icons (react-icons)

Why: Provides a vast library of popular icon sets (including Phosphor Icons) that are easy to import and use as components.

4. File Structure & Key File Locations
To understand this project, it's essential to know where the key logic resides. The project follows a standard Vite + React structure.

diamond-app-web/

README.md: (This file) Project documentation.

package.json: Lists all project dependencies and scripts.

src/: Contains all the application's source code.

main.jsx: (Most Important File) The entry point of the app. It configures the theme system and defines all the application's pages (routes) using React Router. To add a new page, you must add it here.

App.jsx: The main "shell" component. It manages the state of the sidebar menu and renders the current page inside it.

assets/:

animationData.js: Contains the exported JSON data for the Lottie loading animation.

components/:

Sidebar.jsx: The code for the slide-out sidebar menu. All links and navigation logic for the sidebar are here.

context/:

ThemeContext.jsx: (Key File for Theming) Contains all the color data for every theme and the logic to change and save the current theme. To add or remove a theme, you must edit this file.

pages/: Contains the individual page components for the application.

Login.jsx: The standalone login page with the loading animation.

TraderHome.jsx: The main dashboard for the Trader.

BrokerHome.jsx: The main dashboard for the Broker.

AppTheme.jsx: The page for selecting a new app theme.

... (and all other page files).

5. How to Run the Application
To run this project on a local machine, follow these steps:

Open your terminal.

Navigate to the project's root directory: cd path/to/diamond-app-web

Install all the required packages: npm install

Start the development server: npm run dev

Open your web browser and go to the local URL provided by the terminal (usually http://localhost:5173).

6. Future Work & Next Steps
This prototype represents a complete front-end. The next phase of development would involve building the back-end and connecting it to the front-end.

Back-End Development:

Build a REST API using Node.js and Express.js.

Set up a PostgreSQL database with the schema defined in the project documentation.

Implement user authentication, demand management, and other services.

Front-End Integration:

Replace all hardcoded sample data (e.g., in ViewDemands.jsx) with live API calls (fetch or axios) to the back-end.

Store the user's authentication token after login and send it with protected API requests.

Admin Panel:

Build the complete Admin UI as a separate section of the application, with functionality to manage users and post news, as per the documentation.

