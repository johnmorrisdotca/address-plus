<script setup lang="ts">
import "@johnmorrisdotca/address-plus/element/define";

withDefaults(defineProps<{ country?: string }>(), { country: "US" });
</script>

<template>
  <address-field :country="country" label="Shipping address" value="1600 Pennsylvania Ave NW, Washington, DC 20500" validate></address-field>
</template>
