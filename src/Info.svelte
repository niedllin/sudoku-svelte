<script>
  import { createEventDispatcher } from "svelte";

  export let isVictory;
  export let selectedDifficult;

  const dispatch = createEventDispatcher();
  const handleChange = difficult => {
    dispatch("change-difficult", difficult);
  };

  const levels = ["easy", "medium", "hard", "veryHard", "insane"];
  const levelText = {
    easy: "Fácil",
    medium: "Médio",
    hard: "Difícil",
    veryHard: "Muito difícil",
    insane: "Boa sorte!"
  };
</script>

<style>
  .container {
    margin-right: 100px;
  }

 
  ul.level-menu {
    width: 200px;
    color: rgb(156, 156, 156);
  }

  .level-menu li {
    border-bottom: 1px solid rgb(151, 151, 151);
    cursor: pointer;
    padding: 10px;
    transition: all 0.3s;
    user-select: none;
  }

  .level-menu li:hover {
    padding-left: 20px;
  }


  .active {
    background-color: rgb(255, 101, 165);
    color: white;
    font-weight: bold;
  }

  .victory {
    animation: pulse 0.5s alternate infinite;
    color: rgb(255, 242, 59);
    font-size: 2rem;
    font-weight: bold;
    margin: 2rem 0;
    padding: 0 10px;
  }

  @keyframes pulse {
    from {
      transform: scale(1);
    }
    to {
      transform: scale(0.9);
    }
  }
</style>

<div class="container">
  
  <ul class="level-menu">
    {#each levels as level}
      <li
        class={level === selectedDifficult ? 'active' : ''}
        on:click={() => handleChange(level)}>
         {levelText[level]}
      </li>
    {/each}
  </ul>


  {#if isVictory}
    <p class="victory">VOCÊ CONSEGUIU!</p>
  {/if}
</div>
