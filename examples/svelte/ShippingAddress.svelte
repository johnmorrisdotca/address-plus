<script lang="ts">
  import "@johnmorrisdotca/address-plus/element/define";

  let { country = "US" }: { country?: string } = $props();
</script>

<address-field {country} label="Shipping address" value="1600 Pennsylvania Ave NW, Washington, DC 20500" validate></address-field>
