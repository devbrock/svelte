<script>
  let name = "Brock";
  let age = 22;

  $: uppercaseName = name.toUpperCase();

  function upAge() {
    age += 1;
  }

  function changeName() {
    name = "timmy";
  }
</script>

<style>
  h1 {
    color: blue;
  }
</style>

<h1>Hello {uppercaseName}, my age is {age}!</h1>
<button on:click={upAge}>Change Age</button>
<button on:click={changeName}>Change Name</button>
