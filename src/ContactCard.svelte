<script>
  export let userName;
  export let jobTitle;
  export let description;
  export let userImage;

  let initialName = userName;
</script>

<style>

</style>

<div class="card text-white bg-dark p-2 w-50 my-4">
  <div class="text-center w-25">
    <img class="card-img-top" src={userImage} alt={userName} />
  </div>
  <div class="card-body">
    <h1 class="card-title">{userName} / {initialName}</h1>
    <h2 class="card-title">{jobTitle}</h2>
    <p class="card-text">{description}</p>
  </div>
</div>
