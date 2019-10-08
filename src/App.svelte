<script>
  import ContactCard from "./ContactCard.svelte";

  let name = "";
  let title = "";
  let image = "";
  let description = "";
  let formState = "empty";
  let createdContacts = [];

  function addContact() {
    if (
      name.trim().length == 0 ||
      title.trim().length == 0 ||
      image.trim().length == 0 ||
      description.trim().length == 0
    ) {
      formState = "invalid";
      return;
    }
    createdContacts = [
      ...createdContacts,
      {
        name: name,
        jobTitle: title,
        imageUrl: image,
        desc: description
      }
    ];
    formState = "done";
  }

  function clearContact() {
    name = "";
    title = "";
    image = "";
    description = "";
    formState = "empty";
  }
</script>

<style>

</style>

<div class="container my-4">
  <div id="form">
    <div class="input-group mb-3 w-50">
      <label for="userName" class="mr-3">User Name</label>
      <input type="text" class="form-control" bind:value={name} id="userName" />
    </div>
    <div class="input-group mb-3 w-50">
      <label for="jobTitle" class="mr-3">Job Title</label>
      <input
        type="text"
        class="form-control"
        bind:value={title}
        id="jobTitle" />
    </div>
    <div class="input-group mb-3 w-50">
      <label for="image" class="mr-3">Image URL</label>
      <input type="text" class="form-control" bind:value={image} id="image" />
    </div>
    <div class="input-group mb-3 w-50">
      <label for="desc" class="mr-3">Description</label>
      <textarea
        rows="3"
        class="form-control"
        bind:value={description}
        id="desc" />
    </div>
  </div>

  <button on:click={addContact} class="btn btn-primary">
    Add Contact Card
  </button>
  <button on:click={clearContact} class="btn btn-danger">Clear</button>

  {#if formState === 'invalid'}
    <p>Invalid Input</p>
  {:else}
    <p>Please fill out the form and hit add.</p>
  {/if}

  {#each createdContacts as contact}
    <ContactCard
      userName={contact.name}
      jobTitle={contact.jobTitle}
      description={contact.desc}
      userImage={contact.imageUrl} />
  {/each}

</div>
