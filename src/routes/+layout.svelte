<script>
  import '../app.css';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,600&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet" />
</svelte:head>

{@render children()}
