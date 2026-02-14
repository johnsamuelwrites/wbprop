<script setup lang="ts">
import { ref } from 'vue'
import { useWikibaseStore } from '@/stores/wikibase'

const drawer = ref(true)
const wikibaseStore = useWikibaseStore()

const navigationItems = [
  { title: 'Dashboard', icon: 'mdi-view-dashboard', to: '/' },
  { title: 'Properties', icon: 'mdi-format-list-bulleted', to: '/properties' },
  { title: 'Statistics', icon: 'mdi-chart-bar', to: '/statistics' },
  { title: 'Search', icon: 'mdi-magnify', to: '/search' },
  { title: 'Settings', icon: 'mdi-cog', to: '/settings' },
]
</script>

<template>
  <v-app>
    <v-app-bar color="surface" elevation="0" border="b">
      <v-app-bar-nav-icon @click="drawer = !drawer" />

      <v-app-bar-title class="font-weight-bold">
        WBProp
      </v-app-bar-title>

      <template #append>
        <v-chip
          color="primary"
          variant="tonal"
          size="small"
          class="mr-4"
        >
          {{ wikibaseStore.activeConfig.name }}
        </v-chip>

        <v-btn icon="mdi-github" href="https://github.com/johnsamuelwrites/wbprop" target="_blank" />
      </template>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" permanent>
      <v-list nav density="compact">
        <v-list-item
          v-for="item in navigationItems"
          :key="item.title"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          rounded="xl"
        />
      </v-list>

      <template #append>
        <div class="pa-4">
          <v-select
            :model-value="wikibaseStore.activeConfig.id"
            :items="wikibaseStore.allConfigs"
            item-title="name"
            item-value="id"
            label="Wikibase Instance"
            density="compact"
            variant="outlined"
            hide-details
            @update:model-value="wikibaseStore.setActiveConfig($event)"
          />
        </div>
      </template>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.v-app-bar-title {
  flex: none;
}
</style>
