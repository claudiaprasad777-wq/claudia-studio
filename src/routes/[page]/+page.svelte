<script>
  import SitePage from '$lib/SitePage.svelte';
  let { data } = $props();
</script>

{#key data.page}
  <SitePage {...data} />
{/key}
