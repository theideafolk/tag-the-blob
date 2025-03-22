# Tag the Blob: Project File Structure

This document outlines the complete file structure of the "Tag the Blob" game, providing an overview of each file's purpose, components, functions, and dependencies.

## Project Overview

"Tag the Blob" is a 3D multiplayer tag game built with React, Three.js, and related libraries. The game features bouncy blob characters in an infinite arena where players tag each other while collecting power-ups.

## File Structure

### Root Configuration Files

#### `/package.json`
- **Purpose**: Defines project metadata, dependencies, and scripts
- **Dependencies**: 
  - React, React DOM
  - Three.js and related libraries (@react-three/fiber, @react-three/drei)
  - Zustand (for state management)
  - Lucide React (for icons)
  - Development tools (TypeScript, Vite, ESLint, etc.)
- **Scripts**: dev, build, lint, preview

#### `/vite.config.ts`
- **Purpose**: Configuration for Vite build tool
- **Content**: Defines plugins and optimization settings

#### `/tsconfig.json`, `/tsconfig.app.json`, `/tsconfig.node.json`
- **Purpose**: TypeScript configuration files
- **Content**: Compiler options and project references

#### `/tailwind.config.js`, `/postcss.config.js`
- **Purpose**: Configuration for Tailwind CSS and PostCSS
- **Content**: Styling configuration and plugins

#### `/eslint.config.js`
- **Purpose**: ESLint configuration for code linting
- **Content**: Linting rules and plugins

### Core Application Files

#### `/src/main.tsx`
- **Purpose**: Entry point of the application
- **Components**: Renders the main App component
- **Dependencies**: React, ReactDOM

#### `/src/App.tsx`
- **Purpose**: Main application component
- **Components**: Game component, controls info overlay
- **Functions**: 
  - Checks if device is mobile
  - Displays appropriate controls info
- **Dependencies**: React, Game component

#### `/src/index.css`
- **Purpose**: Global styles using Tailwind CSS
- **Content**: Tailwind directives

### Game Components

#### `/src/components/Game.tsx`
- **Purpose**: Sets up the Three.js scene and game loop
- **Components**: Canvas, PerspectiveCamera, OrbitControls, Blob, Arena, Controls, MobileControls, PowerUp, GameUI
- **Functions**: 
  - Initializes game systems
  - Handles device detection
  - Sets up 3D environment
- **Dependencies**: React, @react-three/fiber, @react-three/drei, gameStore

#### `/src/components/Arena.tsx`
- **Purpose**: Creates the infinite playground for the game
- **Components**: Grid, meshes for ground and boundary markers
- **Functions**: Renders the game arena with grid, ground plane, and boundary indicators
- **Dependencies**: React, @react-three/drei, THREE

#### `/src/components/Blob.tsx`
- **Purpose**: Represents player characters
- **Components**: THREE.Group for blob model
- **Functions**: 
  - Loads and renders blob models
  - Handles player movement and collision
  - Applies visual effects for power-ups
- **Dependencies**: React, @react-three/fiber, @react-three/drei, THREE, gameStore, useControls

#### `/src/components/Controls.tsx`
- **Purpose**: Handles keyboard input for player movement
- **Functions**: Manages keyboard events and updates control state
- **Dependencies**: React, useControlsStore

#### `/src/components/MobileControls.tsx`
- **Purpose**: Provides touch controls for mobile devices
- **Components**: Virtual joystick, power-up button
- **Functions**: 
  - Handles touch events
  - Translates touch to movement controls
  - Provides power-up activation button
- **Dependencies**: React, useControlsStore, gameStore

#### `/src/components/PowerUp.tsx`
- **Purpose**: Renders power-up items in the game
- **Components**: THREE.Mesh with different geometries based on power-up type
- **Functions**: 
  - Renders power-ups with visual effects
  - Detects collisions with players
  - Animates power-ups (floating, rotation)
- **Dependencies**: React, @react-three/fiber, THREE, gameStore

#### `/src/components/GameUI.tsx`
- **Purpose**: Displays game information and controls
- **Components**: Game status bar, player status, action buttons, leaderboard
- **Functions**: 
  - Shows round timer and player counts
  - Displays player status and power-up info
  - Provides game controls (join, start, leaderboard)
- **Dependencies**: React, gameStore

#### `/src/components/useControls.ts`
- **Purpose**: Custom hook and store for managing keyboard controls
- **Functions**: 
  - Creates and manages control state
  - Provides setKey function for updating control state
- **Dependencies**: Zustand

### Game State Management

#### `/src/store/gameStore.ts`
- **Purpose**: Central state management for the game
- **Interfaces**: Player, PowerUp, GameState
- **Functions**: 
  - State management for players, power-ups, game status
  - Game logic: starting/ending rounds, tagging players
  - Player management: adding, removing, updating
  - Power-up management: spawning, collecting, activating
  - Bot AI movement
- **Dependencies**: Zustand, THREE

### Type Definitions

#### `/src/vite-env.d.ts`
- **Purpose**: Type definitions for Vite environment
- **Content**: Reference to Vite client types

### Public Assets

#### `/public/blob.glb`
- **Purpose**: 3D model for player blobs
- **Used by**: Blob component

#### `/public/blob-crown.glb`
- **Purpose**: 3D model for the crown worn by "it" blobs
- **Used by**: Blob component

#### `/public/arena.glb`
- **Purpose**: 3D model for the arena (not used in current implementation)
- **Note**: Replaced by custom arena built with Three.js primitives

### HTML Template

#### `/index.html`
- **Purpose**: HTML template for the application
- **Content**: Root div and script tag for the application

## Component Relationships

- **App** contains **Game** as its main component
- **Game** sets up the 3D environment with **Canvas** and includes:
  - **Arena** for the game world
  - **Blob** instances for each player
  - **PowerUp** instances for each active power-up
  - **Controls** for keyboard input
  - **MobileControls** for touch input on mobile devices
  - **GameUI** for the user interface overlay

## State Management

- **useGameStore** (from gameStore.ts) manages the core game state:
  - Player positions, states, and properties
  - Power-up spawning and collection
  - Game round management
  - Bot AI behavior

- **useControlsStore** (from useControls.ts) manages player input:
  - Keyboard state for movement controls
  - Used by Blob component for player movement

## Game Loop and Rendering

The game loop is handled by @react-three/fiber's **useFrame** hook in components like Blob and PowerUp, which runs on each animation frame to update positions, check collisions, and apply visual effects.