<svelte:head>
	<link rel="stylesheet" href="/styles/menu.css">
</svelte:head>

<script>
	import { estado } from './Estado.js'
	import { trocarEstadoDoJogo } from './Estado.js'
</script>



<body>
	<h1>SUDOKU</h1>
	<nav class="navMenu">
	  <a class='menu' on:click={() => trocarEstadoDoJogo('jogar')}>JOGAR</a>
	  <a class='menu' on:click={() => trocarEstadoDoJogo('ajuda')}>DICAS</a>
	  <a class='menu' on:click={() => trocarEstadoDoJogo('sobre')}>SOBRE</a>
	  <div class="dot"></div>
	</nav>

</body>


<style>
	@use postcss-preset-env {
  stage: 0;
}

:root {
  --color-background: #272727;
  --stroke-width: calc(1em / 16);
  --font-size: 30vmin;
  --font-weight: 700;
  --letter-spacing: calc(1em / 8);
}

* {
  box-sizing: border-box;
}

body {
  background-color: var(--color-background);
  display: grid;
  font-family: Poppins, sans-serif;
  margin: 0;
  min-block-size: 100vh;
  place-items: center;
  padding: 5vmin;
}

h1 {
  background-clip: text;
  background-image: linear-gradient(to right, #09f1b8, #00a2ff, #ff00d2, #fed90f);
  color: var(--color-background);
  font-size: var(--font-size);
  font-weight: var(--font-weight);
  letter-spacing: var(--letter-spacing);
  padding: calc(--stroke-width / 2);
  -webkit-text-stroke-color: transparent;
  -webkit-text-stroke-width: var(--stroke-width);
}

@import url("https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap");
* {
  margin: 0;
  padding: 0;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
}

body {
  background: #272727;
  font-family: "Montserrat", sans-serif;
}

.navMenu {
  position: absolute;
  top: 75%;
  left: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
}

.navMenu a {
  color: #f6f4e6;
  text-decoration: none;
  font-size: 1.2em;
  text-transform: uppercase;
  font-weight: 500;
  display: inline-block;
  width: 170px;
  -webkit-transition: all 0.5s ease-in-out;
  transition: all 0.5s ease-in-out;
  cursor:pointer;
}

.navMenu a:hover {
  color: #fddb3a;
}

.navMenu .dot {
  width: 6px;
  height: 6px;
  background: #ff00d2;
  border-radius: 50%;
  opacity: 0;
  -webkit-transform: translateX(30px);
  transform: translateX(30px);
  -webkit-transition: all 0.5s ease-in-out;
  transition: all 0.5s ease-in-out;
}

.navMenu a:nth-child(1):hover ~ .dot {
  -webkit-transform: translateX(30px);
  transform: translateX(30px);
  -webkit-transition: all 0.5s ease-in-out;
  transition: all 0.5s ease-in-out;
  opacity: 1;
}

.navMenu a:nth-child(2):hover ~ .dot {
  -webkit-transform: translateX(200px);
  transform: translateX(200px);
  -webkit-transition: all 0.5s ease-in-out;
  transition: all 0.5s ease-in-out;
  opacity: 1;
}

.navMenu a:nth-child(3):hover ~ .dot {
  -webkit-transform: translateX(380px);
  transform: translateX(380px);
  -webkit-transition: all 0.5s ease-in-out;
  transition: all 0.5s ease-in-out;
  opacity: 1;
}
</style>