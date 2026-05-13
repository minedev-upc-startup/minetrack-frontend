<template>
  <div class="app-shell">
    <header class="app-shell__topbar">
      <router-link :to="{ name: 'home' }" class="app-shell__brand">
        MineTrack
      </router-link>

      <nav class="app-shell__nav">
        <router-link :to="{ name: 'home' }">Home</router-link>
        <router-link :to="{ name: 'about' }">About</router-link>
        <router-link :to="{ name: 'fleet-dashboard' }">Dashboard</router-link>
      </nav>

      <div class="app-shell__actions">
        <router-link :to="{ name: 'iam-sign-in' }">Sign in</router-link>
        <router-link :to="{ name: 'iam-sign-up' }">Sign up</router-link>
      </div>
    </header>

    <main class="app-shell__main">
      <router-view />
    </main>

    <footer class="app-shell__footer">
      <span>MineTrack</span>
      <span>•</span>
      <span>Si no ves el contenido, refresca la página con Ctrl+F5</span>
    </footer>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-shell__topbar {
  display: flex;
  align-items: center;
  gap: var(--mt-space-6);
  padding: var(--mt-space-3) var(--mt-space-6);
  background: var(--mt-color-bg-elevated);
  border-bottom: 1px solid var(--mt-color-border-subtle);
}



