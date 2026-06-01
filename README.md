# React Pool 

## Table of Contents

- [Description](#description)
- [Badges](#badges)
- [Visuals](#visuals)
- [Installation](#installation)
- [Tech](#tech)
- [Support](#support)
- [Contributing](#contributing)
- [Authors and Acknowledgment](#authors-and-acknowledgment)
- [License](#license)
- [Project Status](#project-status)

## Description

This is a second rebuild and refactor of my previous two pool games. The first one was a fullstack pool game, then made into a serverless Next.js app. 

This version was made with Miniplex ECS, Three.js, and Zustand (?)

The database of users was switched from mongoDB to Prisma to enable app to be serverless. Styling was enhanced. 

## Badges

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) 

![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E) ![GitHub](https://img.shields.io/badge/github-%23121011.svg?style=for-the-badge&logo=github&logoColor=white) ![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) ![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white) ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) ![Three.js](https://img.shields.io/badge/three.js-%233E3E3E.svg?style=for-the-badge&logo=three.js&logoColor=white) 

## Visuals

This app has been deployed to Vercel. Visit the site: [Pool Next.js](https://nx-pool.vercel.app/)

![pic1](...)
![pic2](...)
![pic4](...)

## Installation

Play through app site, no installation required. Otherwise clone into local machine and open on IDE:

```bash
# clone the repo
git clone https://github.com/sifzerda/r-pool.git

# move into directory
cd r-pool

# install dependencies
npm install

# run server
npm run start
```
## Tech

Select which apply:

- [React](https://reactjs.org/)
- [Tailwindcss](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)
- [Three.js](https://threejs.org/)
- [Postprocessing](https://github.com/pmndrs/postprocessing)
- [React Router](https://reactrouter.com/en/main)
- [React Icons](https://react-icons.github.io/react-icons/)
- [Miniplex](https://github.com/pmndrs/miniplex)
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber)
- [React Drei](https://github.com/pmndrs/drei)
- [React Three Postprocessing](https://github.com/pmndrs/react-three-postprocessing)
- [Zustand](https://github.com/pmndrs/zustand)
- [Jotai](https://github.com/pmndrs/jotai)
- [Vite Plugin React](https://github.com/vitejs/vite-plugin-react)
- [ESLint](https://eslint.org/)
 
## Support

For support, users can contact me through my portfolio contact form: [here](https://next-portfolio-sifzerdas-projects.vercel.app/contact)

## Contributing

Any contributions you make are greatly appreciated.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement". 
1.	Fork the Project
2.	Create your Feature Branch (git checkout -b feature/NewFeature)
3.	Commit your Changes (git commit -m 'Add some NewFeature')
4.	Push to the Branch (git push origin feature/NewFeature)
5.	Open a Pull Request

## Authors and acknowledgment

The author acknowledges and credits those who have contributed to this project.

## License

Distributed under the MIT License. See LICENSE.txt for more information.

## Project status

This project is incomplete and requires further development. Currently the highscores page, if any, is just for display, further development is needed to allow users to submit their scores.

## ECS structure

Layer	            Responsibility
...................................
Components	        Data only
Systems	            Behavior
Factories       	Create entities
Renderers	        Visuals only
Weapons	Modular     firing logic

## Tasks

- [ ] currently using miniplex ecs, lightweight but not three.js
- [ ] expand ecs structure to something more elaborate, game engine, physics, 3d ball on 2D table, optimization
- [ ] possibly add zustand or jotai