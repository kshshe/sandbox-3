[![Website](https://img.shields.io/website?url=https%3A%2F%2Ffluid.alekseilaud.dev)](https://fluid.alekseilaud.dev)

# Fluid Simulation

A GPU-accelerated fluid physics simulation web application that renders dynamic particle interactions

## Screenshot

![Fluid simulation screenshot](screenshot.gif)

## Features

- Real-time fluid simulation with GPU.js acceleration
- Particle physics with gravity and density effects
- Interactive particle attraction and repulsion
- Customizable simulation parameters (speed, gravity power, particle count)
- Multiple visualization options (acceleration, velocity, point size)

## Demo

Visit the live demo at: [https://fluid.alekseilaud.dev](https://fluid.alekseilaud.dev)

## Controls

- **Mouse**: Attract or repel particles

## Installation

1. Clone the repository:
```bash
git clone https://github.com/kshshe/sandbox-3.git
cd sandbox-3
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:1234`

## Building for Production

```bash
npm run build
```

The production-ready files will be available in the `dist` directory.

## Technologies Used

- [GPU.js](https://gpu.rocks/) - GPU accelerated JavaScript
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- Vanilla HTML5 and JavaScript