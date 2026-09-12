<script lang="ts">
  import { base } from '$app/paths';
  import { page } from '$app/state';
</script>

<h1>{page.status}</h1>
<p class="muted">{page.error?.message}</p>
<p><a href="{base}/">Zurück zur Übersicht</a></p>
