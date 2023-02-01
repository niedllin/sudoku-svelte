<svelte:head>
	<link rel="stylesheet" href="/styles/sobre.css">
</svelte:head>

<script>
	import VoltarMenu from './VoltarMenu.svelte'
</script>


<div class="container">

	<button class="btn draw-border"><VoltarMenu/></button>
	
	<div class="card">
	  <img src="images/vini.jpg" alt="Person" class="card__image">
	  <p class="card__name">Matheus Vinícius </p>
	  <div class="grid-container">		mvfs5@discente.ifpe.edu.br	  </div>
	</div>
	
	
	<div class="card">
	  <img src="https://avatars.githubusercontent.com/u/119949191?v=4" alt="Person" class="card__image">
	  <p class="card__name">Niedllin Araújo </p>
	  <div class="grid-container">		nfaa@discente.ifpe.edu.br	  </div>
	</div>
	
	
	<div class="card">
	  <img src="images/logoIFPE.png" alt="Person" class="card__image">
	  <p class="card__name">Allan Lima </p>
	  <div class="grid-container">		allan.lima@igarassu.ifpe.edu.br	  </div>
    	<div class="grid-container">		-- Referência de Projeto -- </div>
	</div>
  
  <div class="card">
	<img src="https://avatars.githubusercontent.com/u/7515783?v=4" alt="Person" class="card__image">
	<p class="card__name">Vinicius Sabadim  </p>
	<div class="grid-container">		https://github.com/vinicius-sabadim	  </div>
    <div class="grid-container">		-- Referência de Projeto -- </div>
	</div>

</div>

<style>
	@import url("https://fonts.googleapis.com/css2?family=Baloo+Paaji+2:wght@400;500&display=swap");

.container {
  grid-template-columns: 300px 300px 300px;
  grid-gap: 100px;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #f5f5f5;
  font-family: 'Baloo Paaji 2', cursive;
}

.card {
  background-color: #272727;
  height: 25rem;
  border-radius: 0px;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: rgba(0, 0, 0, 0.7);
  color: white;
}

.card__name {
  margin-top: 30px;
  font-size: 2.5em;
}

.card__image {
  height: 160px;
  width: 160px;
  border-radius: 50%;
  border: 5px solid #272133;
  margin-top: 20px;
  box-shadow: 0 0px 30px rgba(235, 25, 110, 1);
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

.grid-container {
  grid-template-columns: 1fr 1fr;
  grid-gap: 20px;
  font-size: 1.2em;
}

</style>


