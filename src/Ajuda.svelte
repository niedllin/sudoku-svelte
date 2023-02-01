<svelte:head>
	<link rel="stylesheet" href="/styles/ajuda.css">
</svelte:head>

<script>
	import VoltarMenu from './VoltarMenu.svelte'
</script>

<button class="btn draw-border"><VoltarMenu/></button>

<body>
  <div class="module-border-wrap"><div class="module">SUDOKU é um jogo de raciocínio e lógica.<br>O objetivo do jogo é completar todos os quadrados utilizando números de 1 a 9.<br>Para completá-los basta seguir a seguinte regra:<br>Não podem haver números repetidos nas linhas horizontais e verticais<br>assim como nos quadrados delimitados por linhas em negrito.</div>
</body>

<style>
body {
  height: 88vh;
  margin: 0;
  display: grid;
  place-items: center;
  background: #272727;
}

.module-border-wrap {
  max-width: 2000px;
  padding: 100rem;
  position: relative;
  background: linear-gradient(to left, #09f1b8, #00a2ff, #ff00d2, #fed90f);
  padding: 3px;
}

.module {
  background: #272727;
  color: white;
  padding: 2rem;
}





.draw-border {
  box-shadow: inset 0 0 0 4px #58cdd1;
  color: #58afd1;
  -webkit-transition: color 0.25s 0.0833333333s;
  transition: color 0.25s 0.0833333333s;
  position: relative;
}

.draw-border::before,
.draw-border::after {
  border: 0 solid transparent;
  box-sizing: border-box;
  content: '';
  pointer-events: none;
  position: absolute;
  width: 0rem;
  height: 0;
  bottom: 0;
  right: 0;
}

.draw-border::before {
  border-bottom-width: 4px;
  border-left-width: 4px;
}

.draw-border::after {
  border-top-width: 4px;
  border-right-width: 4px;
}

.draw-border:hover {
  color: #ffe593;
}

.draw-border:hover::before,
.draw-border:hover::after {
  border-color: #eb196e;
  -webkit-transition: border-color 0s, width 0.25s, height 0.25s;
  transition: border-color 0s, width 0.25s, height 0.25s;
  width: 100%;
  height: 100%;
}

.draw-border:hover::before {
  -webkit-transition-delay: 0s, 0s, 0.25s;
  transition-delay: 0s, 0s, 0.25s;
}

.draw-border:hover::after {
  -webkit-transition-delay: 0s, 0.25s, 0s;
  transition-delay: 0s, 0.25s, 0s;
}

.btn {
  background: none;
  border: none;
  cursor: pointer;
  line-height: 1.5;
  font: 700 1.2rem 'Roboto Slab', sans-serif;
  padding: 0.75em 2em;
  letter-spacing: 0.05rem;
  margin: 1em;
  width: 13rem;
}

.btn:focus {
  outline: 2px dotted #55d7dc;
}

</style>