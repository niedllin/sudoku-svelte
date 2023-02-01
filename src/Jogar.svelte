<svelte:head>
	<link rel="stylesheet" href="/styles/jogar.css">
</svelte:head>

<script>
	import VoltarMenu from './VoltarMenu.svelte'
	import { estado } from "./Estado.js"
	import { trocarEstadoDoJogo } from './Estado.js'
  import Info from "./Info.svelte";
  import Cell from "./Cell.svelte";
  import * as utils from "./utils";

  let selectedDifficult = "hard";
  let gridWithDifficult;
  let gridWithBlockInfo;
  let activePosition = 0;
  let highlightValue = null;

  const startGame = difficult => {
    const grid = utils.generateGrid(3);
    const filledGrid = utils.fillGrid(grid, 3);
    gridWithDifficult = utils.applyGameDifficult(selectedDifficult, filledGrid);
    gridWithBlockInfo = utils.includeBlockInfo(gridWithDifficult, 3);
  };

  const handlePen = ({ detail: { value, position } }) => {
    const isLegal = utils.isLegal(gridWithDifficult, position, value);
    gridWithBlockInfo = gridWithBlockInfo.map(cell => {
      if (cell.position !== position) {
        return cell;
      }

      return {
        ...cell,
        value: value !== 0 ? value : null,
        error: value === 0 ? false : !isLegal
      };
    });
    gridWithDifficult[position] = value;
  };

  const handlePencil = ({ detail: { value, position } }) => {
    if (value === 0) return;

    gridWithBlockInfo = gridWithBlockInfo.map(cell => {
      if (cell.position !== position) {
        return cell;
      }

      const isAlreadyThere = cell.pencil.has(value);
      if (isAlreadyThere) {
        cell.pencil.delete(value);
      } else {
        cell.pencil.add(value);
      }

      return cell;
    });
  };

  const handleChangeDifficult = ({ detail }) => {
    selectedDifficult = detail;
    startGame(selectedDifficult);
  };

  const handleChangeNavigation = ({ detail: value }) => {
    activePosition = value;
  };

  const handleHighlight = ({ detail: value }) => {
    if (highlightValue === value) {
      highlightValue = null;
    } else {
      highlightValue = value;
    }
  };

  $: groupedGrid = utils.groupByBlock(gridWithBlockInfo);

  $: errors = utils.getErrors(gridWithBlockInfo);
  $: missingValues = utils.getMissingValues(gridWithBlockInfo, errors);
  $: isVictory = missingValues === 0;

  startGame(selectedDifficult);

  window.addEventListener("keydown", e => {
    e.preventDefault();
    const { key, ctrlKey } = e;

    const [isValid, action] = utils.validateKeyInteraction(key, activePosition);
    if (!isValid) return;

    if (action !== "digit") {
      activePosition = utils.getNewActivePosition(activePosition, action);
    } else {
      const cell = gridWithBlockInfo[activePosition];
      if (cell.readonly) return;

      const event = {
        detail: {
          value: parseInt(key, 10),
          position: activePosition
        }
      };

      ctrlKey ? handlePencil(event) : handlePen(event);
    }
  });
</script>

<button class="btn draw-border"><VoltarMenu/></button>

<div class="container">
  <Info
    on:change-difficult={handleChangeDifficult}
    {isVictory}
    {selectedDifficult} />
  <div class="grid">
    {#each groupedGrid as block}
      <div class="block">
        {#each block as cell}
          <div class="cell">
            <Cell
              on:change-navigation={handleChangeNavigation}
              on:highlight={handleHighlight}
              on:pen={handlePen}
              on:pencil={handlePencil}
              {cell}
              {activePosition}
              {highlightValue} />
          </div>
        {/each}
      </div>
    {/each}
  </div>
</div>

<style>
  .container {
    background-color: #272727;
    display: flex;
    justify-content: center;
    padding-top: 20px;
  }
  .grid {
    background-color: #272727;
    border: 1px solid #272727;
    display: grid;
    grid-template-columns: auto auto auto;
    grid-gap: 6px;
  }
  .block {
    background-color: #ccc;
    display: grid;
    grid-gap: 3px;
    grid-template-columns: auto auto auto;
  }
  .cell {
    align-items: center;
    display: flex;
    font-size: 2rem;
    height: calc(80vh / 9);
    justify-content: center;
    position: relative;
    user-select: none;
    width: calc(80vh / 9);
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



