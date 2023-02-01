<script>
  import { createEventDispatcher } from "svelte";

  export let cell;
  export let activePosition;
  export let highlightValue;

  const options = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const dispatch = createEventDispatcher();

  const cellClicked = e => {
    const element = e.currentTarget.querySelector("input");
    element.focus();

    dispatch("highlight", cell.value);
    dispatch("change-navigation", cell.position);
  };
</script>

<style>
  input {
    background-color: transparent;
    border: none;
    color: transparent;
    height: 100%;
    margin: 0;
    outline: none;
    text-align: center;
    text-shadow: 0 0 0 darkslategray;
    user-select: none;
    width: 100%;
  }

  input:disabled {
    background-color: inherit;
  }

  .container {
    height: 100%;
  }

  .readOnly {
    background-color: rgb(179, 184, 255);
  }

  .notReadOnly {
    background-color: white;
  }

  .pencil-container {
    display: grid;
    font-size: 18px;
    grid:
      "option1 option2 option3"
      "option4 option5 option6"
      "option7 option8 option9";
    height: 100%;
    left: 0;
    position: absolute;
    text-align: center;
    top: 0;
    width: 100%;
  }

  .option {
    align-items: center;
    color: transparent;
    display: flex;
    justify-content: center;
  }

  .visibleOption {
    color: rgb(0, 0, 0);
  }

  .option1 {
    grid-area: option1;
  }
  .option2 {
    grid-area: option2;
  }
  .option3 {
    grid-area: option3;
  }
  .option4 {
    grid-area: option4;
  }
  .option5 {
    grid-area: option5;
  }
  .option6 {
    grid-area: option6;
  }
  .option7 {
    grid-area: option7;
  }
  .option8 {
    grid-area: option8;
  }
  .option9 {
    grid-area: option9;
  }

  .hasError input {
    background-color: lavenderblush;
    text-shadow: 0 0 0 salmon;
  }

  .keyboardActive {
    background-color: rgb(155, 155, 155);
  }

  .keyboardActive input {
    background-color: rgb(155, 155, 155);
  }

  .highlight {
    background-color: rgb(149, 110, 255);
  }

  .highlight input {
    background-color: rgb(149, 110, 255);
  }
</style>

<div
  class={`container
  ${cell.readonly ? 'readOnly' : 'notReadOnly'}
  ${cell.error ? 'hasError' : ''}
  ${cell.position === activePosition ? 'keyboardActive' : ''}
  ${highlightValue && cell.value === highlightValue ? 'highlight' : ''}`}
  on:click={cellClicked}>
  <input bind:value={cell.value} disabled={cell.readonly} type="text" />
  {#if !cell.value}
    <ul class="pencil-container">
      {#each options as option}
        <li
          class={`option option${option} ${cell.pencil.has(option) ? 'visibleOption' : ''}`}>
           {option}
        </li>
      {/each}
    </ul>
  {/if}
</div>
